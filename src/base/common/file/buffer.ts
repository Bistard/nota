
export class DataBuffer {

    public readonly buffer: Uint8Array;
    public readonly bufferLength: number;

    /** @internal */
    private constructor(buffer: Uint8Array) {
        this.buffer = buffer;
        this.bufferLength = this.buffer.length;
    }

    /**
     * @description allocates and returns a new DataBuffer to hold given byte 
     * size of data.
     */
    public static alloc(byteSize: number): DataBuffer {
        return new DataBuffer(Buffer.allocUnsafe(byteSize));
    }

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
        // this line of code is to create a 'reference' or a 'pointer' to the 
        // original data without copying values.
        const referencedData = Buffer.from(originalData.buffer, originalData.byteOffset, originalData.byteLength);
        return new DataBuffer(referencedData as Uint8Array);
    }

    /**
     * @description Construct a DataBuffer from a given string.
     */
    public static fromString(content: string): DataBuffer {
        return new DataBuffer(Buffer.from(content));
    }

    public slice(start?: number, end?: number): DataBuffer {
		// IMPORTANT: use subarray instead of slice because TypedArray#slice
		// creates shallow copy and NodeBuffer#slice doesn't. The use of subarray
		// ensures the same, performance, behaviour.
		return new DataBuffer(this.buffer.subarray(start, end));
	}

    /** 
     * @description Returns a string representation of an array. 
     * @example DataBuffer.fromString('Hello').toString() => 'Hello'
     */
    public toString(): string {
        return this.buffer.toString();
    }

    /**
     * @description Sets (writes) a value or an array of values to this buffer 
     * starting from the given offset.
     */
	public set(arrayLike: DataBuffer | Uint8Array, offset?: number): void {
		if (arrayLike instanceof DataBuffer) {
			this.buffer.set(arrayLike.buffer, offset);
		} else {
			this.buffer.set(arrayLike, offset);
		}
	}

}