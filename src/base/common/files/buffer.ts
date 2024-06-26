import { panic } from "src/base/common/utilities/panic";

const hasBuffer: boolean = typeof Buffer !== 'undefined';
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * @class A class to simulate a real buffer which provides the functionality to
 * stores the actual data as a sequence of unsigned int (8 bits).
 */
export class DataBuffer {

    // [fields]

    public readonly buffer: Uint8Array;
    public readonly bufferLength: number;

    // [private constructor]

    private constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.bufferLength = this.buffer.length;
    }
    
    // [public static method]

    /**
     * @description allocates and returns a new DataBuffer to hold given byte 
     * size of data.
     */
    public static alloc(byteSize: number): DataBuffer {
        return DataBuffer.__alloc(byteSize);
    }

    private static __alloc = 
        hasBuffer 
        ? (byteSize: number) => new DataBuffer(Buffer.allocUnsafe(byteSize))
        : (byteSize: number) => new DataBuffer(new Uint8Array(byteSize));

    /**
     * @description concatenates given array of DataBuffer into one single 
     * DataBuffer.
     * 
     * @param totalLength this gives the choice to avoid recalculate totalLength 
     * of all the DataBuffers.
     */
    public static concat(buffers: DataBuffer[], totalLength?: number): DataBuffer {

        // if no totalLength is given, we calculate by ourself.
        if (typeof totalLength === 'undefined') {
			totalLength = 0;
			for (let i = 0, len = buffers.length; i < len; i++) {
				totalLength += buffers[i]!.bufferLength;
			}
		}

        const newBuffer = DataBuffer.alloc(totalLength);
        
        // do the actual data concatenation.
        let offset = 0;
        for (let i = 0, len = buffers.length; i < len; i++) {
            const subBuffer = buffers[i]!;
            newBuffer.set(subBuffer, offset);
            offset += subBuffer.bufferLength;
        }
        
        return newBuffer;
    }

    /**
     * @description create a 'reference' DataBuffer which contains the original 
     * data. The returned DataBuffer shares the memory with the given 'Uint8Array'.
     */
    public static wrap(originalData: Uint8Array): DataBuffer {
        if (hasBuffer && !Buffer.isBuffer(originalData)) {
            // this line of code is to create a 'reference' or a 'pointer' to the 
            // original data without copying values.
            originalData = Buffer.from(originalData.buffer, originalData.byteOffset, originalData.byteLength);
        }
        return new DataBuffer(originalData);
    }

    /**
     * @description Copy a clone of the given buffer.
     */
    public static copy(buffer: DataBuffer): DataBuffer {
        const newBuffer = DataBuffer.alloc(buffer.bufferLength);
        newBuffer.set(buffer);
        return newBuffer;
    }

    /**
     * @description Construct a DataBuffer from a given string.
     */
    public static fromString(content: string): DataBuffer {
        return DataBuffer.__fromString(content);
    }

    private static __fromString = 
        hasBuffer
        ? (content: string) => new DataBuffer(Buffer.from(content))
        : (content: string) => new DataBuffer(textEncoder.encode(content));

    // [public methods]

    public slice(start?: number, end?: number): DataBuffer {
		// IMPORTANT: use subarray instead of slice because TypedArray#slice
		// creates shallow copy and NodeBuffer#slice doesn't. The use of subarray
		// ensures the same, performance, behavior.
        return new DataBuffer(this.buffer.subarray(start, end));
	}

    /** 
     * @description Returns a string representation of an array. 
     * @example DataBuffer.fromString('Hello').toString() => 'Hello'
     */
    public toString(): string {
        return DataBuffer.__toString(this.buffer);
    }

    private static __toString = 
        hasBuffer
        ? (buffer: Uint8Array) => buffer.toString()
        : (buffer: Uint8Array) => textDecoder.decode(buffer);

    /**
     * @description Sets (writes) a value or an array of values to this buffer 
     * starting from the given offset.
     */
	public set(arrayLike: DataBuffer | Uint8Array | ArrayBuffer | ArrayBufferView, offset?: number): void {
		if (arrayLike instanceof DataBuffer) {
			this.buffer.set(arrayLike.buffer, offset);
		} 
        else if (arrayLike instanceof Uint8Array) {
			this.buffer.set(arrayLike, offset);
		}
        else if (arrayLike instanceof ArrayBuffer) {
			this.buffer.set(new Uint8Array(arrayLike), offset);
		} 
        else if (ArrayBuffer.isView(arrayLike)) {
			this.buffer.set(new Uint8Array(arrayLike.buffer, arrayLike.byteOffset, arrayLike.byteLength), offset);
		} 
        else {
			panic('DataBuffer: cannot identify the raw buffer.');
		}
	}

    public readUInt8(offset: number): number {
        return this.buffer[offset]!;
    }

    public writeUInt8(offset: number, value: number): void {
        this.buffer[offset] = value;
    }

    public readUInt32BE(offset: number): number {
        return (
            this.buffer[offset + 0]! * 2 ** 24 +
            this.buffer[offset + 1]! * 2 ** 16 +
            this.buffer[offset + 2]! * 2 **  8 +
            this.buffer[offset + 3]!
        );
    }
    
    public writeUInt32BE(offset: number, value: number): void {
        this.buffer[offset + 3] = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 2] = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 1] = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 0] = (value & 0b11111111);
    }

    public readUInt32LE(offset: number): number {
        return (
            (this.buffer[offset + 0]! <<  0) |
            (this.buffer[offset + 1]! <<  8) |
            (this.buffer[offset + 2]! << 16) |
            (this.buffer[offset + 3]! << 24)
        );
    }
    
    public writeUInt32LE(value: number, offset: number): void {
        this.buffer[offset + 0]! = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 1]! = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 2]! = (value & 0b11111111);
        value >>= 8;
        this.buffer[offset + 3]! = (value & 0b11111111);
    }
}

export interface IReader {
    /**
     * @description Read given number of bytes from the current buffer.
     */
    read(bytes: number): DataBuffer;
}

export class BufferReader implements IReader {

    private _pos = 0;

    constructor(private buffer: DataBuffer) {}

    public read(bytes: number): DataBuffer {
        const result = this.buffer.slice(this._pos, this._pos + bytes);
        this._pos += bytes;
        return result;
    }
}

export interface IWriter {
    /**
     * @description Write the given buffer into the current buffer.
     */
    write(buffer: DataBuffer): void;
}

export class BufferWriter implements IWriter {

    private readonly _bufferStack: DataBuffer[] = [];

    constructor() {}

    get buffer(): DataBuffer {
        return DataBuffer.concat(this._bufferStack);
    }

    public write(buffer: DataBuffer): void {
        // We only concat when we try to access it. Save time.
        this._bufferStack.push(buffer);
    }
}