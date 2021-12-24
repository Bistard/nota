import { DataBuffer } from "src/base/common/file/buffer";
import { ICreateReadStreamOptions, IFileSystemProviderWithOpenReadWriteClose } from "src/base/common/file/file";
import { URI } from "src/base/common/file/uri";

export interface IReadableStreamEvent<T> {

    /**
	 * The 'data' event is emitted whenever the stream is
	 * relinquishing ownership of a chunk of data to a consumer.
	 *
	 * @warning PLEASE UNDERSTAND THAT ADDING A DATA LISTENER CAN
	 * TURN THE STREAM INTO FLOWING MODE. IT IS THEREFOR THE
	 * LAST LISTENER THAT SHOULD BE ADDED AND NOT THE FIRST
	 *
	 * @note Use `listenStream` as a helper method to listen to
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

export interface IReadableStream<T> extends IReadableStreamEvent<T> {
	/** Stops emitting any events until resume() is called. */
	pause(): void;

	/** Starts emitting events again after pause() was called. */
	resume(): void;

	/** Destroys the stream and stops emitting any event. */
	destroy(): void;

	/** Allows to remove a listener that was previously added. */
	removeListener(event: string, callback: Function): void;
}

export interface IWriteableStream<T> extends IReadableStream<T> {
    
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
}

/** @description A function to convert the original datatype to the target datatype. */
export interface IDataConverter<original, target> {
    (data: original): target;
}

/**
 * @description Just an identifier to point out this is a concatenater function 
 * which to combine all the buffers into a new single one buffer.
 */
export interface IConcatenater<T> {
    /**
     * a function which takes one parameter called 'data' with type of 'T[]' and 
	 * return type is 'T'.
     */
    (data: T[]): T; 
}

/** @description helper function to create a new buffer stream instance. */
export function newWriteableBufferStream(): IWriteableStream<DataBuffer> {
	return newWriteableStream<DataBuffer>(chunks => DataBuffer.concat(chunks));
}

/** @description helper function to create a new stream instance. */
export function newWriteableStream<T>(concatenater: IConcatenater<T>): IWriteableStream<T> {
    return new WriteableStream<T>(concatenater);
}

/**
 * @description A writeable stream for handling data flowing between buffer and 
 * consumers.
 */
export class WriteableStream<T> implements IWriteableStream<T> {

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
     * Manipulation on stream buffer
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
     * Manipulation on stream state
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
		// TODO
    }

    /***************************************************************************
     * Notifying Listeners with data buffer
     **************************************************************************/

    // slice to avoid listener mutation from delivering event

    /** @description notifying and firing data to the listeners */
    private _fireData(data: T): void {
        this.listeners.listener.slice(0).forEach(listener => listener(data));
    }

    /** @description notifying and firing error to the listeners */
    private _fireError(error: Error): void {
        this.listeners.error.slice(0).forEach(listener => listener(error));
    }

    /** @description notifying the listeners that the stream is reached to the end */
    private _fireEnd(): void {
        this.listeners.end.slice(0).forEach(listener => listener());
    }
    
    /***************************************************************************
     * Listening to stream event
     **************************************************************************/

     public on(event: 'data', callback: (data: T) => void): void;
     public on(event: 'error', callback: (err: Error) => void): void;
     public on(event: 'end', callback: () => void): void;
     public on(event: 'data' | 'error' | 'end', listener: (_arg?: any) => void): void 
	 {
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
 * @description Helper to fully read a T stream into a T or consuming a stream 
 * fully, awaiting all the events without caring about the data.
 */
export function streamToBuffer<T>(stream: IWriteableStream<DataBuffer>): Promise<DataBuffer> {
    return consumeStream(stream, chunks => DataBuffer.concat(chunks));
}

export function consumeStream<T>(stream: IWriteableStream<T>, concatenater: IConcatenater<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		
        const chunks: T[] = [];
		listenStream(
			stream, 
			{
				onData: chunk => chunks.push(chunk),
				onError: error => reject(error),
				onEnd: () => resolve(concatenater(chunks))
			}
		);
	});
}

export interface IStreamListener<T> {

	/**
	 * The 'data' event is emitted whenever the stream is
	 * relinquishing ownership of a chunk of data to a consumer.
	 */
	onData(data: T): void;

	/** Emitted when any error occurs. */
	onError(err: Error): void;

	/**
	 * The 'end' event is emitted when there is no more data
	 * to be consumed from the stream. The 'end' event will
	 * not be emitted unless the data is completely consumed.
	 */
	onEnd(): void;
}

/**
 * @description Helper to listen to all events of a T stream in proper order.
 */
 export function listenStream<T>(stream: IWriteableStream<T>, listener: IStreamListener<T>): void {
	stream.on('error', error => listener.onError(error));
	stream.on('end', () => listener.onEnd());
    /**
     * Adding the `data` listener will turn the stream
     * into flowing mode. As such it is important to
     * add this listener last (DO NOT CHANGE!)
     */
	stream.on('data', data => listener.onData(data));
}