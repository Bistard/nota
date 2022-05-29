import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { AsyncEmitter, AsyncRegister, Emitter, Register } from "src/base/common/event";
import { IDimension } from "src/base/common/util/size";
import { IpcCommand } from "src/base/electron/ipcCommand";
import { ipcRendererOn, ipcRendererSend, ipcRendererSendData } from "src/base/electron/register";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IIpcService = createDecorator<IIpcService>('ipc-service');

export interface IIpcService extends IDisposable {

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

    /**
     * Fires when the open directory dialog chosed a path.
     */
    onDidOpenDirectoryDialog: Register<string>;

    /**
     * @description Opens a dialog that can open a directory.
     * @param path A path that the dialog initially displaying.
     */
    openDirectoryDialog(path?: string): void;

    dispose(): void;
}

/**
 * @description A very simple service that supports application activity-related 
 * events which communicated using IPC technology.
 */
export class IpcService implements IIpcService {
    
    // [field]

    private _disposables = new DisposableManager;

    // [event]

    private _onWindowMaximize = this._disposables.register(new Emitter<void>());
    public onWindowMaximize = this._onWindowMaximize.registerListener;

    private _onWindowUnmaximize = this._disposables.register(new Emitter<void>());
    public onWindowUnmaximize = this._onWindowUnmaximize.registerListener;

    private _onWindowBlur = this._disposables.register(new Emitter<void>());
    public onWindowBlur = this._onWindowBlur.registerListener;

    private _onDidFullScreenChange = this._disposables.register(new Emitter<boolean>());
    public onDidFullScreenChange = this._onDidFullScreenChange.registerListener;

    private _onApplicationClose = this._disposables.register(new AsyncEmitter<void>());
    public onApplicationClose = this._onApplicationClose.registerListener;

    private _onWindowResize = this._disposables.register(new Emitter<IDimension>());
    public onWindowResize = this._onWindowResize.registerListener;

    private _onDidOpenDirectoryDialog = this._disposables.register(new Emitter<string>());
    public onDidOpenDirectoryDialog = this._onDidOpenDirectoryDialog.registerListener;
    
    // [constructor]

    constructor() {
        this.registerListeners();
    }

    // [public method]

    public openDirectoryDialog(path?: string): void {
        ipcRendererSendData(IpcCommand.OpenDirectory, path);
    }

    public dispose(): void {
        this._disposables.dispose();
    }
    
    // [private helper method]
    
    private registerListeners(): void {
        
        ipcRendererOn(IpcCommand.WindowMaximize, () => this._onWindowMaximize.fire());
        ipcRendererOn(IpcCommand.WindowUnmaximize, () => this._onWindowUnmaximize.fire());
        ipcRendererOn(IpcCommand.WindowBlur, () => this._onWindowBlur.fire());
        
        ipcRendererOn(IpcCommand.EnterFullScreen, () => this._onDidFullScreenChange.fire(true));
        ipcRendererOn(IpcCommand.LeaveFullScreen, () => this._onDidFullScreenChange.fire(false));

        ipcRendererOn(IpcCommand.WindowResize, (_event, width: number, height: number) => this._onWindowResize.fire({ width: width, height: height }));

        ipcRendererOn(IpcCommand.OpenDirectory, (_event, path: string) => this._onDidOpenDirectoryDialog.fire(path));
        
        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn(IpcCommand.AboutToClose, async () => {

            await this._onApplicationClose.fireAsync();
            ipcRendererSend(IpcCommand.RendererReadyForClose);

        });
    }

}