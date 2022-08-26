import { IDisposable } from "src/base/common/dispose";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IpcClient } from "src/code/platform/ipc/browser/ipc";
import { ChannelType, IChannel } from "src/code/platform/ipc/common/channel";

export const IIpcService = createService<IIpcService>('ipc-service');

export interface IIpcService extends IDisposable {
    getChannel(channel: ChannelType): IChannel;
}

/**
 * @class Provides communication to the main process using IPC through different
 * channels that are already registered in the main process.
 * 
 * A wrapper of {@link IpcClient}.
 */
export class IpcService implements IIpcService {

    private readonly connection: IpcClient;

    constructor(windowID: number) {
        this.connection = new IpcClient(`window:${windowID}`);
    }

    public getChannel(channel: ChannelType): IChannel {
        return this.connection.getChannel(channel);
    }

    public dispose(): void {
        this.connection.dispose();
    }

}