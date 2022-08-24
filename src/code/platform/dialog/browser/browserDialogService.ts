import { IDialogService as IDialogServiceInterface } from "src/code/platform/dialog/common/dialog";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IIpcService } from "src/code/platform/ipc/browser/ipcService";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { ProxyChannel } from "src/code/platform/ipc/common/proxy";

export const IDialogService = createDecorator<IBrowserDialogService>('dialog-service');

export interface IBrowserDialogService extends IDialogServiceInterface {}

export class BrowserDialogService {
    constructor(@IIpcService ipcService: IIpcService) {
        return ProxyChannel.unwrapChannel<IDialogServiceInterface>(ipcService.getChannel(IpcChannel.Dialog));
    }
}