import { DataBuffer } from "src/base/common/file/buffer";
import { ICreateReadStreamOptions, IFileSystemProviderWithOpenReadWriteClose } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";

export interface IStreamEvent<T> {

    /**
	 * The 'data' event is emitted whenever the stream is
	 * relinquishing ownership of a chunk of data to a consumer.
	 *
	 * NOTE: PLEASE UNDERSTAND THAT ADDING A DATA LISTENER CAN
	 * TURN THE STREAM INTO FLOWING MODE. IT IS THEREFOR THE
	 * LAST LISTENER THAT SHOULD BE ADDED AND NOT THE FIRST
	 *
	 * Use `listenStream` as a helper method to listen to
	 * stream events in the right order.
	 */
    on(event: 'data', callback: (data: T) => void): void;

    /**
	 * Emitted when any error occurs.
	 */
    on(event: 'error', callback: (err: Error) => void): void;
    
    /**
	 * The 'end' event is emitted when there is no more data
	 * to be consumed from the stream. The 'end' event will
	 * not be emitted unless the data is completely consumed.
	 */
    on(event: 'end', callback: () => void): void;
}

export interface IStream<T> extends IStreamEvent<T> {
    
    /**
	 * Writing data to the stream will trigger the on('data')
	 * event listener if the stream is flowing and buffer the
	 * data otherwise until the stream is flowing.
	 *
	 * If a `highWaterMark` is defined and writing to the
	 * stream reaches this limit, a promise will be returned
	 * that should be awaited on before writing more data.
	 * Otherwise there is a risk of buffering a large number
	 * of data chunks without consumer.
	 */
    write(data: T): void | Promise<void>;

    /**
	 * Signals an error to the consumer of the stream via the
	 * on('error') handler if the stream is flowing.
	 *
	 * NOTE: call `end` to signal that the stream has ended,
	 * this DOES NOT happen automatically from `error`.
	 */
	error(error: Error): void;

	/**
	 * Signals the end of the stream to the consumer. If the
	 * result is provided, will trigger the on('data') event
	 * listener if the stream is flowing and buffer the data
	 * otherwise until the stream is flowing.
	 */
	end(result?: T): void;

    /**
	 * Stops emitting any events until resume() is called.
	 */
	pause(): void;

	/**
	 * Starts emitting events again after pause() was called.
	 */
	resume(): void;

	/**
	 * Destroys the stream and stops emitting any event.
	 */
	destroy(): void;

	/**
	 * Allows to remove a listener that was previously added.
	 */
	removeListener(event: string, callback: Function): void;
}

/**
 * @description a function to convert the original data type to the target data type.
*/
export interface IDataConverter<original, target> {
    (data: original): target;
}

export async function readFileIntoStream<T>(
    provider: IFileSystemProviderWithOpenReadWriteClose, 
    resource: URI, 
    stream: IStream<T>, 
    dataConverter: IDataConverter<DataBuffer, T>, 
    options: ICreateReadStreamOptions
): Promise<void> {

    let error: Error | undefined = undefined;
    try {

        await _doReadFileIntoStream(provider, resource, stream, dataConverter, options);

    } catch(err: any) {
        
        error = err;

    } finally {

        if (error) {
            stream.error(error);
        }

        stream.end();
    }
}

async function _doReadFileIntoStream<T>(
    provider: IFileSystemProviderWithOpenReadWriteClose, 
    resource: URI, 
    stream: IStream<T>, 
    dataConverter: IDataConverter<DataBuffer, T>, 
    options: ICreateReadStreamOptions
): Promise<void> {
    
    const fd = await provider.open(resource, { create: false, unlock: false } );

    try {
        
        let totalBytesRead = 0;
        let bytesRead = 0;
        let allowedRemainingBytes = (options && typeof options.length === 'number') ? options.length : undefined;

        let buffer = DataBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));

        let posInFile = options && typeof options.position === 'number' ? options.position : 0;
        let posInBuffer = 0;

        do {
            // read from source (fd) at current position (posInFile) into buffer (buffer) at
			// buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
			bytesRead = await provider.read(fd, posInFile, buffer.buffer, posInBuffer, buffer.bufferLength - posInBuffer);

            posInFile += bytesRead;   
            posInBuffer += bytesRead;
            totalBytesRead += bytesRead;

            if (typeof allowedRemainingBytes === 'number') {
				allowedRemainingBytes -= bytesRead;
			}

            // when buffer full, create a new one and emit it through stream
			if (posInBuffer === buffer.bufferLength) {
                await stream.write(dataConverter(buffer));
				buffer = DataBuffer.alloc(Math.min(options.bufferSize, typeof allowedRemainingBytes === 'number' ? allowedRemainingBytes : options.bufferSize));
				posInBuffer = 0;
			}

        } while(bytesRead > 0 && (typeof allowedRemainingBytes !== 'number' || allowedRemainingBytes > 0));

        // wrap up with last buffer and write to the stream
		if (posInBuffer > 0) {
			let lastChunkLength = posInBuffer;
			if (typeof allowedRemainingBytes === 'number') {
				lastChunkLength = Math.min(posInBuffer, allowedRemainingBytes);
			}
			stream.write(dataConverter(buffer.slice(0, lastChunkLength)));
		}

    } catch(err) {
        
        throw err;

    } finally {

        await provider.close(fd);

    }
}

/**
 * @readonly just an identifier to point out this is a concatenater function 
 * which to combine all the buffers into the single one buffer.
 */
export interface IConcatenater<T> {
    /**
     * a function which takes one parameter called 'data' with type of 'T[]' and return type is 'T'.
     */
    (data: T[]): T; 
}

/**
 * @description helper function to create a new stream instance.
 */
export function newStream<T>(concatenater: IConcatenater<T>): IStream<T> {
    return new Stream<T>(concatenater);
}

/**
 * @description helper function to create a new buffer stream instance.
 */
export function newBufferStream(): IStream<DataBuffer> {
	return newStream<DataBuffer>(chunks => DataBuffer.concat(chunks));
}

/**
 * @description a stream for handling data flowing between buffer and consumers
 */
export class Stream<T> implements IStream<T> {

    private readonly concatenater: IConcatenater<T>;
    private readonly highWaterMark: number | undefined;

    private readonly state = {
		flowing: false,
		ended: false,
		destroyed: false
	};

	private readonly buffer = {
		data: [] as T[],
		error: [] as Error[]
	};

	private readonly listeners = {
		listener: [] as { (data: T): void }[],
		error: [] as { (error: Error): void }[],
		end: [] as { (): void }[]
	};

    private readonly pendingWritePromises: Function[] = [];
    
    constructor(concatenater: IConcatenater<T>, highWaterMark?: number) {
        this.concatenater = concatenater;
        this.highWaterMark = highWaterMark;
    }

    /***************************************************************************
     * Notifitying listeners
     **************************************************************************/
    
    public write(data: T): void | Promise<void> {
        
        if (this.state.destroyed) {
			return;
		}
        
        // flowing: directly send data to the listeners 
        if (this.state.flowing) {
         	this._fireData(data);
            return;
		}
        
        // not flowing: buffering the data until reflowing
        this.buffer.data.push(data);

        // highWaterMark check
        if (this.highWaterMark && this.buffer.data.length > this.highWaterMark) {
            return new Promise(resolve => this.pendingWritePromises.push(resolve));
        }
        return;
    }

    public error(error: Error): void {
        
        if (this.state.destroyed) {
            return;
        }

        // flowing: directly send the error to the listeners
        if (this.state.flowing) {
            this._fireError(error);
            return;
        }

		// not flowing: buffering the error until reflowing
        this.buffer.error.push(error);
    }

    public end(data?: T): void {

        if (this.state.destroyed) {
			return;
		}

        // end with data if provided
		if (typeof data !== 'undefined') {
			this.write(data);
		}

		if (this.state.flowing) {
            // flowing: send 'end' event to listeners
			this._fireEnd();
			this.destroy();
		} else {
            // not flowing: remember state		
            this.state.ended = true;
        }
    }

    /***************************************************************************
     * Manipulation to stream
     **************************************************************************/

	public pause(): void {
		if (this.state.destroyed) {
			return;
		}
		this.state.flowing = false;
	}

	public resume(): void {
        if (this.state.destroyed) {
			return;
		}

		if (!this.state.flowing) {
			this.state.flowing = true;

			// emit buffered events
			this._flowData();
			this._flowErrors();
			this._flowEnd();
		}
    }

	public destroy(): void {
        if (!this.state.destroyed) {
			this.state.destroyed = true;
			this.state.ended = true;

			this.buffer.data.length = 0;
			this.buffer.error.length = 0;

			this.listeners.listener.length = 0;
			this.listeners.error.length = 0;
			this.listeners.end.length = 0;

			this.pendingWritePromises.length = 0;
		}
    }

	public removeListener(event: string, callback: Function): void {

    }

    /***************************************************************************
     * Actual Notifying Listeners with data
     **************************************************************************/

    // slice to avoid listener mutation from delivering event

    /**
     * @description notifying and firing data to the listeners
     */
    private _fireData(data: T): void {
        this.listeners.listener.slice(0).forEach(listener => listener(data));
    }

    /**
     * @description notifying and firing error to the listeners
     */
    private _fireError(error: Error): void {
        this.listeners.error.slice(0).forEach(listener => listener(error));
    }

    /**
     * @description notifying the listeners that the stream is reached to the end
     */
    private _fireEnd(): void {
        this.listeners.end.slice(0).forEach(listener => listener());
    }
    
    /***************************************************************************
     * Listening to stream event
     **************************************************************************/

     on(event: 'data', callback: (data: T) => void): void;
     on(event: 'error', callback: (err: Error) => void): void;
     on(event: 'end', callback: () => void): void;
     on(event: 'data' | 'error' | 'end', listener: (_arg?: any) => void): void {

        if (this.state.destroyed) {
			return;
		}

        switch (event) {
			case 'data':
				this.listeners.listener.push(listener);

				// switch into flowing mode as soon as the first 'data'
				// listener is added and we are not yet in flowing mode
				this.resume();

                return;

			case 'end':
				this.listeners.end.push(listener);

				// emit 'end' event directly if we are flowing
				// and the end has already been reached
				if (this.state.flowing && this._flowEnd()) {
					this.destroy();
				}
				
                return;

			case 'error':
				this.listeners.error.push(listener);

				// emit buffered 'error' events unless done already
				// now that we know that we have at least one listener
				if (this.state.flowing) {
					this._flowErrors();
				}
                
                return;

		}

     }
     
    /***************************************************************************
     * Direct Manipulation on data/error/end
     **************************************************************************/

     private _flowData(): void {
		if (this.buffer.data.length) {
			const entireDataBuffer = this.concatenater(this.buffer.data);

			this._fireData(entireDataBuffer);

            // cleaning the data
			this.buffer.data.length = 0;

			// When the buffer is empty, resolve all pending data 
            // P.S. these data are pending because they had reached the highWaterMark before
			const pendingWritePromises = [...this.pendingWritePromises];
			this.pendingWritePromises.length = 0;
			pendingWritePromises.forEach(pendingWritePromise => pendingWritePromise());
		}
	}

	private _flowErrors(): void {
		if (this.listeners.error.length > 0) {
			for (const error of this.buffer.error) {
				this._fireError(error);
			}
            // cleaning the error
			this.buffer.error.length = 0;
		}
	}

	private _flowEnd(): boolean {
		if (this.state.ended) {
			this._fireEnd();
			return this.listeners.end.length > 0;
		}
		return false;
	}

}

/**
 * Helper to fully read a T stream into a T or consuming
 * a stream fully, awaiting all the events without caring
 * about the data.
 */
export function streamToBuffer<T>(stream: IStream<DataBuffer>): Promise<DataBuffer> {
    return consumeStream(stream, chunks => DataBuffer.concat(chunks));
}

export function consumeStream<T>(stream: IStream<T>, concatenater: IConcatenater<T>): Promise<T>;
export function consumeStream(stream: IStream<unknown>): Promise<undefined>;
export function consumeStream<T>(stream: IStream<T>, concatenater?: IConcatenater<T>): Promise<T | undefined> {
	return new Promise((resolve, reject) => {
		
        const chunks: T[] = [];
		listenStream(stream, {
			onData: chunk => {
				if (concatenater) {
					chunks.push(chunk);
				}
			},
			onError: error => {
				if (concatenater) {
					reject(error);
				} else {
					resolve(undefined);
				}
			},
			onEnd: () => {
				if (concatenater) {
					resolve(concatenater(chunks));
				} else {
					resolve(undefined);
				}
			}
		});
	});
}

export interface IStreamListener<T> {

	/**
	 * The 'data' event is emitted whenever the stream is
	 * relinquishing ownership of a chunk of data to a consumer.
	 */
	onData(data: T): void;

	/**
	 * Emitted when any error occurs.
	 */
	onError(err: Error): void;

	/**
	 * The 'end' event is emitted when there is no more data
	 * to be consumed from the stream. The 'end' event will
	 * not be emitted unless the data is completely consumed.
	 */
	onEnd(): void;
}

/**
 * Helper to listen to all events of a T stream in proper order.
 */
 export function listenStream<T>(stream: IStream<T>, listener: IStreamListener<T>): void {
	stream.on('error', error => listener.onError(error));
	stream.on('end', () => listener.onEnd());
    /**
     * Adding the `data` listener will turn the stream
     * into flowing mode. As such it is important to
     * add this listener last (DO NOT CHANGE!)
     */
	stream.on('data', data => listener.onData(data));
}