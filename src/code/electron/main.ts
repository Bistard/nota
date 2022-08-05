import { BrowserWindow, ipcMain, app, dialog } from 'electron';
import { join, resolve } from 'src/base/common/file/path';
import { IpcCommand } from 'src/base/electron/ipcCommand';

/**
 * @description main electron startup class, instantiates at end of the file.
 */
class Main {

    private winMain: Electron.BrowserWindow | null = null;
    
    private isDevlToolsOn = false;
    
    constructor() {
        this.createWindow();
        this.setAppListeners();
    }

    /**
     * @description instantiates the winMain and seutup a series of window-related
     * listeners.
     */
    public createWindow(): void {

        app.whenReady().then(() => {

            this.winMain = new BrowserWindow({
                height: 800,
                width: 1200,
                minWidth: 300,
                minHeight: 200,
                webPreferences: {
                    /**
                     * Node.js is only available in main / preload process.
                     * Node.js us also be available in the renderer process.
                     * Thus a preload.js is needed.
                     * 
                     * Absolute path needed.
                     */
                    nodeIntegration: true,
                    preload: resolve(join(__dirname, 'preload.js')),
                    
                    /**
                     * Context Isolation is a feature that ensures that both 
                     * your preload scripts and Electron's internal logic run in 
                     * a separate context to the website you load in 
                     * a webContents. This is important for security purposes as 
                     * it helps prevent the website from accessing Electron 
                     * internals or the powerful APIs your preload script has 
                     * access to.
                     * 
                     * This means that the (eg. window / document) object the 
                     * preload script has access to is actually a different 
                     * object than the website would have access to.
                     */
                    contextIsolation: false,
                    devTools: true,
                },
                resizable: true,
                show: false,
                frame: false
            });

            // REVIEW: test
            this.winMain!.webContents.openDevTools({mode: 'detach', activate: true});
            
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

        this.winMain.webContents.on('devtools-closed', () => {
            this.isDevlToolsOn = false;
        });

        this.winMain.webContents.on('devtools-opened', () => {
            this.isDevlToolsOn = true;
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
        ipcMain.on(IpcCommand.OpenDirectory, async (_event, data: string[]) => {

            // if default path provided, otherwise we choose desktop.
            const path = data[0] ? data[0] : app.getPath('desktop');
            
            const res = await dialog.showOpenDialog(
                this.winMain!,
                {
                    defaultPath: path,
                    buttonLabel: 'open a file or folder',
                    properties: [
                        'openDirectory',
                    ],
                }
            )
            
            if (res === undefined) {
                throw 'opened path is undefined';
            }

            if (!res.canceled) {
                let rootdir = res.filePaths[0];
                this.winMain!.webContents.send(IpcCommand.OpenDirectory, rootdir);
            }
        });

        // once renderer process is ready, we do the actual closing
        ipcMain.on(IpcCommand.RendererReadyForClose, () => {
            this.winMain!.close();
        });
        
        ipcMain.on(IpcCommand.ToggleDevelopTool, () => {
            this.__toggleDevTool();
        });

        ipcMain.on(IpcCommand.ErrorInWindow, () => {
            this.__toggleDevTool(true);
        });

        ipcMain.on(IpcCommand.ReloadWindow, () => {
            this.winMain!.webContents.reload(); 
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

    /**
     * @description Toggles the development tool.
     * @param force Forces the development tool on or off.
     */
    private __toggleDevTool(force?: boolean): void {

        if (force === this.isDevlToolsOn) {
            return;
        }

        if (!this.isDevlToolsOn) {
            this.winMain!.webContents.openDevTools({mode: 'detach', activate: true});
        } else {
            this.winMain!.webContents.closeDevTools();
        }
    }

}

/** 
 * @readonly '❤hello, world!❤'
 */
new Main();
