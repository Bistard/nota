import { AsyncEmitter, AsyncRegister, Emitter, Register } from "src/base/common/event";
import { IDimension } from "src/base/common/size";
import { IpcCommand } from "src/base/electron/ipcCommand";
import { ipcRendererOn, ipcRendererSend } from "src/base/electron/register";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IIpcService = createDecorator<IIpcService>('ipc-service');

export interface IIpcService {

    /**
     * Fires when the window is maximized.
     */
    onWindowMaximize: Register<void>;

    /**
     * Fires when the window is unmaximized.
     */
    onWindowUnmaximize: Register<void>;

    /**
     * Fires when the window is blured.
     */
    onWindowBlur: Register<void>;

    /**
     * True when fullscreen is on, false otherwise.
     */
    onDidFullScreenChange: Register<boolean>;

    /**
     * Fires when the application is about to be closed.
     */
    onApplicationClose: AsyncRegister<void>;

    /**
     * Fires when the window is resizing.
     */
    onWindowResize: Register<IDimension>;
}

/**
 * @description A very simple service that supports application activity-related 
 * events which communicated using IPC technology.
 */
export class IpcService implements IIpcService {
    
    private _onWindowMaximize: Emitter<void> = new Emitter();
    public onWindowMaximize: Register<void> = this._onWindowMaximize.registerListener;

    private _onWindowUnmaximize: Emitter<void> = new Emitter();
    public onWindowUnmaximize: Register<void> = this._onWindowUnmaximize.registerListener;

    private _onWindowBlur: Emitter<void> = new Emitter();
    public onWindowBlur: Register<void> = this._onWindowBlur.registerListener;

    private _onDidFullScreenChange: Emitter<boolean> = new Emitter();
    public onDidFullScreenChange: Register<boolean> = this._onDidFullScreenChange.registerListener;

    private _onApplicationClose: AsyncEmitter<void> = new AsyncEmitter();
    public onApplicationClose: AsyncRegister<void> = this._onApplicationClose.registerListener;

    private _onWindowResize: Emitter<IDimension> = new Emitter();
    public onWindowResize: Register<IDimension> = this._onWindowResize.registerListener;

    constructor() {

        this.registerListeners();

    }

    private registerListeners(): void {
        
        ipcRendererOn(IpcCommand.WindowMaximize, () => this._onWindowMaximize.fire());
        ipcRendererOn(IpcCommand.WindowUnmaximize, () => this._onWindowUnmaximize.fire());
        ipcRendererOn(IpcCommand.WindowBlur, () => this._onWindowBlur.fire());
        
        ipcRendererOn(IpcCommand.EnterFullScreen, () => this._onDidFullScreenChange.fire(true));
        ipcRendererOn(IpcCommand.LeaveFullScreen, () => this._onDidFullScreenChange.fire(false));

        ipcRendererOn(IpcCommand.WindowResize, (_event, width: number, height: number) => this._onWindowResize.fire({ width: width, height: height }));

        
        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn(IpcCommand.AboutToClose, async () => {

            await this._onApplicationClose.fireAsync();
            ipcRendererSend(IpcCommand.RendererReadyForClose);

        });
    }

}