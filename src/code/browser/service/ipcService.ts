import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { AsyncEmitter, AsyncRegister, Emitter, Register } from "src/base/common/event";
import { IDimension } from "src/base/common/util/size";
import { IpcChannel } from "src/base/common/ipcChannel";
import { ipcRendererOn, ipcRendererSend, ipcRendererSendData } from "src/base/electron/register";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IIpcService = createDecorator<IIpcService>('ipc-deprecated-service');

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

    private readonly _onWindowMaximize = this._disposables.register(new Emitter<void>());
    public readonly onWindowMaximize = this._onWindowMaximize.registerListener;

    private readonly _onWindowUnmaximize = this._disposables.register(new Emitter<void>());
    public readonly onWindowUnmaximize = this._onWindowUnmaximize.registerListener;

    private readonly _onWindowBlur = this._disposables.register(new Emitter<void>());
    public readonly onWindowBlur = this._onWindowBlur.registerListener;

    private readonly _onDidFullScreenChange = this._disposables.register(new Emitter<boolean>());
    public readonly onDidFullScreenChange = this._onDidFullScreenChange.registerListener;

    private readonly _onApplicationClose = this._disposables.register(new AsyncEmitter<void>());
    public readonly onApplicationClose = this._onApplicationClose.registerListener;

    private readonly _onWindowResize = this._disposables.register(new Emitter<IDimension>());
    public readonly onWindowResize = this._onWindowResize.registerListener;

    private readonly _onDidOpenDirectoryDialog = this._disposables.register(new Emitter<string>());
    public readonly onDidOpenDirectoryDialog = this._onDidOpenDirectoryDialog.registerListener;
    
    // [constructor]

    constructor() {
        this.registerListeners();
    }

    // [public method]

    public openDirectoryDialog(path?: string): void {
        ipcRendererSendData(IpcChannel.OpenDirectory, path);
    }

    public dispose(): void {
        this._disposables.dispose();
    }
    
    // [private helper method]
    
    private registerListeners(): void {
        
        ipcRendererOn(IpcChannel.WindowMaximize, () => this._onWindowMaximize.fire());
        ipcRendererOn(IpcChannel.WindowUnmaximize, () => this._onWindowUnmaximize.fire());
        ipcRendererOn(IpcChannel.WindowBlur, () => this._onWindowBlur.fire());
        
        ipcRendererOn(IpcChannel.EnterFullScreen, () => this._onDidFullScreenChange.fire(true));
        ipcRendererOn(IpcChannel.LeaveFullScreen, () => this._onDidFullScreenChange.fire(false));

        ipcRendererOn(IpcChannel.WindowResize, (_event, width: number, height: number) => this._onWindowResize.fire({ width: width, height: height }));

        ipcRendererOn(IpcChannel.OpenDirectory, (_event, path: string) => this._onDidOpenDirectoryDialog.fire(path));
        
        // once the main process notifies this renderer process, we try to 
        // finish the following job.
        ipcRendererOn(IpcChannel.AboutToClose, async () => {

            await this._onApplicationClose.fireAsync();
            ipcRendererSend(IpcChannel.RendererReadyForClose);

        });
    }

}