import { Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { ChannelType, IpcChannel } from "src/platform/ipc/common/channel";

export interface ISender {
    send(channel: ChannelType, message: unknown): void;
}

/**
 * A protocol is a set of rules for formatting and processing data. Essentially, 
 * it allows connected devices to communicate with each other, regardless of any 
 * differences in their internal processes, structure or design.
 */
export interface IProtocol {
    /**
     * A register function that registers a callback to receive data from the 
     * other sides.
     */
    readonly onData: Register<DataBuffer>;

    /**
     * Defines a way to send the data.
     * @param data The data to be send.
     */
    send(data: DataBuffer): void;
}

/**
 * @class Used here for communication between different electron processes such
 * as IIpcRenderer and IpcMain.
 * 
 * @note The only valid data for transferring is {@link DataBuffer}. 
 * @note The actual data type being transferred using IPC is {@link Uint8Array}.
 */
export class IpcProtocol implements IProtocol {

    private readonly sender: ISender;
    public readonly onData: Register<DataBuffer>;

    constructor(sender: ISender, onData: Register<DataBuffer>) {
        this.sender = sender;
        this.onData = onData;
    }

    public send(message: DataBuffer): void {
        this.sender.send(IpcChannel.DataChannel, message.buffer);
    }

    public disconnect(): void {
        this.sender.send(IpcChannel.Disconnect, undefined);
    }
}