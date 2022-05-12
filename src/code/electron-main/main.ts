import * as Path from'path';
import { BrowserWindow, ipcMain, app, dialog } from 'electron';
import { IpcCommand } from 'src/base/electron/ipcCommand';

/**
 * @description main electron startup class, instantiates at end of the file.
 */
class Main {

    private winMain: Electron.BrowserWindow | null = null;
    private isDevlToolsOn: boolean = false;
    
    constructor() {
        this.createWindow();
        this.setAppListeners();
    }

    /**
     * @description instantiates the winMain and seutup a few window relevant.
     * listeners.
     */
    public createWindow(): void {

        app.whenReady().then(() => {

            this.winMain = new BrowserWindow({
                width: 1200,
                height: 800,
                minWidth: 300,
                minHeight: 200,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    enableRemoteModule: true,
                    devTools: true,
                    preload: Path.join(__dirname, 'preload.js'),
                },
                resizable: true,
                show: false,
                frame: false
            });
            
            // sets winMain in the global scope so that other modules can also 
            // access winMain.
            global.winMain = this.winMain;

            this.registerWindowListeners();
            
            this.registerIpcListeners();

        });
    }

    /**
     * @description not just main.js, other xxxModule will also have similar 
     * funcitons to handle responses or register shortcuts.
     */
    private setAppListeners(): void {
        
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user 
        // quits explicitly with Cmd + Q.
        app.on('window-all-closed', function () {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

    }

    /**
     * @description Registers all the window related listeners for notifying 
     * renderer process.
     */
    private registerWindowListeners(): void {
        if (this.winMain === null) {
            return;
        }
        
        // remove the default menu. Shortcuts like reload and developer-tool
        // are set in the later
        this.winMain.setMenu(null);

        /* const gotTheLock = app.requestSingleInstanceLock(); */

        // loads index.html first and displays when ready
        this.winMain.loadFile('./index.html');
        this.winMain.webContents.on('did-finish-load', () => {
            
            // send app path to the renderer process
            this.winMain!.webContents.send('get-app-path', app.getAppPath());
            
            // display window
            this.winMain!.show();
        });

        // titleBar listeners
        this.winMain.webContents.on('devtools-closed', () => {
            this.isDevlToolsOn = false;
        });

        this.winMain.on('maximize', () => {
            this.winMain!.webContents.send(IpcCommand.WindowMaximize);
        });

        this.winMain.on('unmaximize', () => {
            this.winMain!.webContents.send(IpcCommand.WindowUnmaximize);
        });

        this.winMain.on('closed', () => {
            this.winMain = null;
        });

        this.winMain.on('blur', () => {
            this.winMain!.webContents.send('closeContextMenu');
        });

        this.winMain.on('enter-full-screen', () => {
            this.winMain!.webContents.send(IpcCommand.EnterFullScreen);
        });

        this.winMain.on('leave-full-screen', () => {
            this.winMain!.webContents.send(IpcCommand.LeaveFullScreen);
        });

        this.winMain.on('resize', () => {
            let size = this.winMain!.getSize();
            let width = size[0]!;
            let height = size[1]!;
            this.winMain!.webContents.send(IpcCommand.WindowResize, width, height);
        });
    }

    /**
     * @description Registers all the IPC related listeners from the renderer 
     * process.
     */
    private registerIpcListeners(): void {
        
        ipcMain.on(IpcCommand.WindowMinimize, () => {
            this.winMain!.minimize();
        });

        ipcMain.on(IpcCommand.WindowRestore, () => {
            if (this.winMain!.isMaximized()) {
                this.winMain!.restore();
            } else {
                this.winMain!.maximize();
            }
        });

        // notify the renderer process before actual closing
        ipcMain.on(IpcCommand.WindowClose, () => {
            this.winMain!.webContents.send(IpcCommand.AboutToClose);
        });

        // response to FolderModule, default path is 'desktop' and only can
        // open directory.
        ipcMain.on(IpcCommand.OpenDirectory, (_event, data: string[]) => {

            // if default path provided, otherwise we choose desktop.
            const path = data[0] ? data[0] : app.getPath('desktop');
            
            dialog.showOpenDialog(
                this.winMain!,
                {
                    defaultPath: path,
                    buttonLabel: 'open a file or folder',
                    properties: [
                        'openDirectory',
                    ],
                }
            ).then((path) => {
                if (path === undefined) {
                    throw 'opened path is undefined';
                }

                if (!path.canceled) {
                    let rootdir = path.filePaths[0];
                    this.winMain!.webContents.send(IpcCommand.OpenDirectory, rootdir);
                }
            });
        });

        // once renderer process is ready, we do the actual closing
        ipcMain.on(IpcCommand.RendererReadyForClose, () => {
            this.winMain!.close();
        });
        
        ipcMain.on(IpcCommand.OpenDevelopTool, () => {
            if (this.isDevlToolsOn === false) {
                this.winMain!.webContents.openDevTools({mode: 'detach', activate: true});
            } else {
                this.winMain!.webContents.closeDevTools();
            }
            (this.isDevlToolsOn as any as number) ^= 1;
        });

        ipcMain.on(IpcCommand.ReloadWindow, () => {
            this.winMain!.webContents.reload(); 
        });

        ipcMain.on(IpcCommand.ErrorInWindow, () => {
            if (this.isDevlToolsOn === false) {
                this.winMain!.webContents.toggleDevTools();
            }
        });

        ipcMain.on(IpcCommand.AlwaysOnTopOn, () => {
            this.winMain!.setAlwaysOnTop(true, 'screen-saver');
        });

        ipcMain.on(IpcCommand.AlwaysOnTopOff, () => {
            this.winMain!.setAlwaysOnTop(false, 'screen-saver');
        });
    
        ipcMain.on(IpcCommand.Test, (_event, data) => {
            console.log(data);
        });
    }

}

/** 
 * @readonly '❤hello, world!❤'
 */
new Main();
