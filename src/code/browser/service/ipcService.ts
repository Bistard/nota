import { delayFor } from "src/base/common/async";
import { AsyncEmitter, AsyncRegister, Register } from "src/base/common/event";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IIpcService = createDecorator<IIpcService>('ipc-service');

export interface IIpcService {

    onApplicationClose: AsyncRegister<void>;

}

/**
 * @description 
 */
export class IpcService implements IIpcService {
    
    private _onApplicationClose: AsyncEmitter<void> = new AsyncEmitter();
    public onApplicationClose: AsyncRegister<void> = this._onApplicationClose.registerListener;

    constructor() {

        this.registerListeners();

    }

    private registerListeners(): void {
        
        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn('closingApp', async () => {
            
            await this._onApplicationClose.fireAsync();
            ipcRendererSend('rendererReadyForClosingApp');

        });
    }

}