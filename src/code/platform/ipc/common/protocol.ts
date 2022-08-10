import { Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { ChannelType, IpcChannel } from "src/code/platform/ipc/common/channel";

export interface ISender {
    send(channel: ChannelType, message: unknown): void;
}

/**
 * A protocol is a set of rules for formatting and processing data. Essentially, 
 * it allows connected devices to communicate with each other, regardless of any 
 * differences in their internal processes, structure or design.
 * 
 * T: sending / receiving data type.
 */
export interface IProtocol<T> {
    /**
     * A register function that registers a callback to receive data from the 
     * other sides.
     */
    readonly onData: Register<T>;

    /**
     * Defines a way to send the data.
     * @param data The data to send with type T.
     */
    send(data: T): void;
}

/**
 * @class Used here for communication between different electron processes.
 */
export class Protocol<T = DataBuffer> {

    private readonly sender: ISender;
    public readonly onData: Register<T>;

    constructor(sender: ISender, onData: Register<T>) {
        this.sender = sender;
        this.onData = onData;
    }

    public send(message: T): void {
        this.sender.send(IpcChannel.DataChannel, message);
    }

    public disconnect(): void {
        this.sender.send(IpcChannel.Disconnect, undefined);
    }
}