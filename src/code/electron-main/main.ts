import * as Path from'path';
import { BrowserWindow, ipcMain, app, dialog } from 'electron';
import * as ElectronLocalshortcut from 'electron-localshortcut';
import { IpcCommand } from 'src/base/electron/ipcCommand';

/**
 * @description main electron startup class, instantiates at end of the file.
 */
class Main {

    winMain: Electron.BrowserWindow | null;
    
    constructor() {
        this.winMain = null;
        this.createWindow();
        this._setListeners();
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
            this.winMain.on('maximize', () => {
                this.winMain!.webContents.send('isMaximized');
            });

            this.winMain.on('unmaximize', () => {
                this.winMain!.webContents.send('isRestored');
            });

            this.winMain.on('closed', () => {
                this.winMain = null;
            });

            this.winMain.on('blur', () => {
                this.winMain!.webContents.send('closeContextMenu');
            });

            ipcMain.on('minApp', () => {
                this.winMain!.minimize();
            });

            ipcMain.on('maxResApp', () => {
                if (this.winMain!.isMaximized()) {
                    this.winMain!.restore();
                } else {
                    this.winMain!.maximize();
                }
            });

            // notify the renderer process before actual closing
            ipcMain.on('closeApp', () => {
                this.winMain!.webContents.send('closingApp');
            });

            // once renderer process is ready, we do the actual closing
            ipcMain.on('rendererReadyForClosingApp', () => {
                this.winMain!.close();
            });
            
            // response to FolderModule, default path is 'desktop' and only can
            // open directory.
            ipcMain.on('openDir', () => {
                dialog.showOpenDialog(
                    this.winMain!,
                    {
                        /* defaultPath: app.getPath('desktop'), */
                        defaultPath: 'D:\\dev\\AllNote',
                        //defaultPath: '/Users/apple/markdownNote_latest/forTestingOnly',
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
                        // eg. D:\dev\AllNote
                        let rootdir = path.filePaths[0];
                        this.winMain!.webContents.send('openDir', rootdir);
                    }
                });
            });

            ipcMain.on(IpcCommand.OpenDevelopTool, () => {
                this.winMain!.webContents.toggleDevTools();
            });

            ipcMain.on(IpcCommand.ReloadWindow, () => {
                this.winMain!.webContents.reload(); 
            });
        
            ipcMain.on(IpcCommand.Test, (_event, data) => {
                console.log(data);
            });

        });
    }

    /**
     * @description not just main.js, other xxxModule will also have similar 
     * funcitons to handle responses or register shortcuts.
     */
    private _setListeners(): void {
        
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

        // Setting local shortcuts. Many thanks to ElectronLocalshortcut library
        app.whenReady().then(() => {

            /**
             * @readonly the following shortcuts mainly were disabled at first 
             * when the default menu were removed. Here is just to add them back 
             * individually.
             */
            
            // ElectronLocalshortcut.register(this.winMain, 'Ctrl+Shift+I', () => {
            //     this.winMain!.webContents.openDevTools();
            // });

        });

    }

}

/** 
 * @readonly '❤hello, world!❤'
 */
new Main();
