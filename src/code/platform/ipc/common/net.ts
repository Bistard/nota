import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { BufferReader, BufferWriter, DataBuffer } from "src/base/common/file/buffer";
import { ITask } from "src/base/common/util/async";
import { If, Pair } from "src/base/common/util/type";
import { ChannelType, IChannel, IServerChannel } from "src/code/platform/ipc/common/channel";
import { IProtocol } from "src/code/platform/ipc/common/protocol";

// #region Type Declaration

/**
 * Data types are allowed to be transfered between {@link ClientBase} and 
 * {@link ServerBase}.
 */
export const enum DataType {
    Undefined = 0,
	String,
	Buffer,
	DataBuffer,
	Array,
	Object
}

// [request (client perspective)]

const enum RequestType {
    Command = 0,
    Register,
    Unregister
}

type ICommandRequest     = { type: RequestType.Command   ; id: number; channel: ChannelType; commandOrEvent: string; arg?: any; };
type IRegisterRequest    = { type: RequestType.Register  ; id: number; channel: ChannelType; commandOrEvent: string; arg?: any; };
type IUnregisterRequest  = { type: RequestType.Unregister; id: number; };
type IRequest = ICommandRequest | IRegisterRequest | IUnregisterRequest;

type ICommandHeader    = [RequestType.Command    , number, ChannelType, string];
type IRegisterHeader   = [RequestType.Register   , number, ChannelType, string];
type IUnregisterHeader = [RequestType.Unregister , number];
type IRequestHeader = ICommandHeader | IRegisterHeader | IUnregisterHeader;
type IRequestBody = any;

type SerializeType<IsClient, IsBody> = If<IsBody, any, If<IsClient, IRequestHeader, IResponseHeader>>;

/**
 * @internal
 * @class When channel server / client needs to send response / request to
 * the other side, the class can serialize the sending data into standard data
 * type {@link DataBuffer} during communication.
 * 
 * During each data serialization, it will try to do three things:
 *      1. Write 1 byte for data type.
 *      2. Write 4 bytes for size length.
 *      3. Write enough bytes for the actual data.
 * 
 * @note When writing {@link DataType.Undefined} it only does the first thing.
 */
class DataSerializer {

    // [field]

    private readonly _writer = new BufferWriter();

    private static readonly _8BitType = {
        Undef:   DataSerializer.__get8BitType(DataType.Undefined),
        Str:     DataSerializer.__get8BitType(DataType.String),
        Buf:     DataSerializer.__get8BitType(DataType.Buffer),
        DataBuf: DataSerializer.__get8BitType(DataType.DataBuffer),
        Arr:     DataSerializer.__get8BitType(DataType.Array),
        Obj:     DataSerializer.__get8BitType(DataType.Object),
    };

    private static __get8BitType(value: number): DataBuffer {
        const result = DataBuffer.alloc(1);
        result.writeUInt8(0, value);
        return result;
    }

    // [constructor]

    constructor() {}

    // [public methods]

    get buffer(): DataBuffer {
        return this._writer.buffer;
    }

    public serialize<IsClient, IsBody>(data: SerializeType<IsClient, IsBody>): void {
                
        if (typeof data === 'undefined') {
            this._writer.write(DataSerializer._8BitType.Undef);
        } 
        else if (typeof data === 'string') {
            const buffer = DataBuffer.fromString(data);
            this._writer.write(DataSerializer._8BitType.Str);
            this._writer.write(this.__write32BitSize(buffer.bufferLength));
            this._writer.write(buffer);
        } 
        else if (Buffer.isBuffer(data)) {
            const buffer = DataBuffer.wrap(data);
            this._writer.write(DataSerializer._8BitType.Buf);
            this._writer.write(this.__write32BitSize(buffer.bufferLength));
            this._writer.write(buffer);
        } 
        else if (data instanceof DataBuffer) {
            this._writer.write(DataSerializer._8BitType.DataBuf);
            this._writer.write(this.__write32BitSize(data.bufferLength));
            this._writer.write(data);
        } 
        else if (Array.isArray(data)) {
            this._writer.write(DataSerializer._8BitType.Arr);
            this._writer.write(this.__write32BitSize(data.length));
            for (const el of data) {
                this.serialize<false, true>(el);
            }
        } 
        else {
            const buffer = DataBuffer.fromString(JSON.stringify(data));
            this._writer.write(DataSerializer._8BitType.Obj);
            this._writer.write(this.__write32BitSize(buffer.bufferLength));
            this._writer.write(buffer);
        }
        return;
    }

    private __write32BitSize(size: number): DataBuffer {
        const result = DataBuffer.alloc(4);
        result.writeUInt32BE(0, size);
        return result;
    }
}

// [response (client perspective)]

const enum ResponseType {
    EventFire = 0,
    PromiseResolve,
    PromiseReject,
}

type IEventFireResponse      = { type: ResponseType.EventFire;      requestID: number; dataOrError: any; }
type IPromiseResolveResponse = { type: ResponseType.PromiseResolve; requestID: number; dataOrError: any; }
type IPromiseRejectResponse  = { type: ResponseType.PromiseReject;  requestID: number; dataOrError: Error; }
type IResponse = IEventFireResponse | IPromiseRejectResponse | IPromiseResolveResponse;

type IEventFireHeader =      [ResponseType.EventFire,      number];
type IPromiseResolveHeader = [ResponseType.PromiseResolve, number];
type IPromiseRejectHeader =  [ResponseType.PromiseReject,  number];
type IResponseHeader = IEventFireHeader | IPromiseResolveHeader | IPromiseRejectHeader;
type IResponseBody = any;
type DeserializeType<IsClient, IsBody> = If<IsBody, IResponseBody, If<IsClient, IResponseHeader, IRequestHeader>>;

/**
 * @internal
 * @class When channel server / client receives request / response from the 
 * other side, the class can deserialize the receiving data from standard data
 * type {@link DataBuffer} into actual data type.
 */
class BufferDeserializer {

    // [field]

    private _reader: BufferReader;

    // [constructor]

    constructor(buffer: DataBuffer) {
        this._reader = new BufferReader(buffer);
    }

    // [public methods]

    public deserialize<IsClient extends boolean, IsBody extends boolean>(): DeserializeType<IsClient, IsBody> {
        const type = this._reader.read(1).readUInt8(0);
        let result: any;
        
        if (type === DataType.Undefined) {
            result = undefined;
        } 
        else if (type === DataType.String) {
            result = this._reader.read(this.__readSize()).toString();
        } 
        else if (type === DataType.Buffer) {
            result = this._reader.read(this.__readSize()).buffer;
        } 
        else if (type === DataType.DataBuffer) {
            result = this._reader.read(this.__readSize());
        } 
        else if (type === DataType.Object) {
            result = JSON.parse(this._reader.read(this.__readSize()).toString());
        } 
        else if (type === DataType.Array) {
            const length = this.__readSize();
            result = [];
            for (let i = 0; i < length; i++) {
                result.push(this.deserialize());
            }
        }

        return result;
    }

    // [private helper method]

    private __readSize(): number {
        return this._reader.read(4).readUInt32BE(0);
    }
}

// #endregion
