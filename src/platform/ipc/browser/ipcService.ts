import { Disposable, IDisposable } from "src/base/common/dispose";
import { ILogService } from "src/base/common/logger";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IpcClient } from "src/platform/ipc/browser/ipcClient";
import { ChannelType, IChannel } from "src/platform/ipc/common/channel";

export const IIpcService = createService<IIpcService>('ipc-service');

export interface IIpcService extends IDisposable, IService {
    getChannel(channel: ChannelType): IChannel;
}

/**
 * @class Provides communication to the main process using IPC through different
 * channels that are already registered in the main process.
 * 
 * A wrapper of {@link IpcClient}.
 */
export class IpcService extends Disposable implements IIpcService {

    declare _serviceMarker: undefined;

    private readonly connection: IpcClient;

    constructor(
        windowID: number,
        @ILogService logService: ILogService,
    ) {
        super();
        logService.debug('IpcClient', 'Constructing...');
        this.connection = this.__register(new IpcClient(`window:${windowID}`));
        logService.debug('IpcClient', `Constructed with window ID: ${windowID}`);
    }

    public getChannel(channel: ChannelType): IChannel {
        return this.connection.getChannel(channel);
    }
}