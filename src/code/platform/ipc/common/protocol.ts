import { Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { ChannelType, IpcChannel } from "src/code/platform/ipc/common/channel";

export interface ISender {
    send(channel: ChannelType, message: unknown): void;
}

/**
 * @class A protocol is a set of rules for formatting and processing data. 
 * Essentially, it allows connected devices to communicate with each other, 
 * regardless of any differences in their internal processes, structure or 
 * design.
 * 
 * Used here for communication between different processes.
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