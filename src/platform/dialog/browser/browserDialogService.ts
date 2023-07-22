import { IDialogService as IDialogServiceInterface } from "src/platform/dialog/common/dialog";
import { createService } from "src/platform/instantiation/common/decorator";
import { IIpcService } from "src/platform/ipc/browser/ipcService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ProxyChannel } from "src/platform/ipc/common/proxy";

export const IDialogService = createService<IBrowserDialogService>('dialog-service');

export interface IBrowserDialogService extends IDialogServiceInterface { }

export class BrowserDialogService {
    constructor(@IIpcService ipcService: IIpcService) {
        return ProxyChannel.unwrapChannel<IDialogServiceInterface>(ipcService.getChannel(IpcChannel.Dialog));
    }
}