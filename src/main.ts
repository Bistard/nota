const OS = require('os')
const path = require('path')

const { BrowserWindow, ipcMain, app, dialog. Mennu } = require('electron')
const ElectronLocalshortcut = require('electron-localshortcut')

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
    createWindow(): void {
        app.whenReady().then(() => {

            this.winMain = new BrowserWindow({
                width: 1200,
                height: 800,
                minWidth: 300,
                minHeight: 200,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    devTools: true,
                    preload: path.join(__dirname, 'preload.js'),
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
                this.winMain!.show();
            })

            // titleBar listeners
            this.winMain.on('maximize', () => {
                this.winMain!.webContents.send('isMaximized');
            })

            this.winMain.on('unmaximize', () => {
                this.winMain!.webContents.send('isRestored');
            })

            this.winMain.on('closed', () => {
                this.winMain = null;
            })

            ipcMain.on('minApp', () => {
                this.winMain!.minimize();
            })

            ipcMain.on('maxResApp', () => {
                if (this.winMain!.isMaximized()) {
                    this.winMain!.restore();
                } else {
                    this.winMain!.maximize();
                }
            })

            ipcMain.on('closeApp', () => {
                this.winMain!.close();
            })

            // response to FolderModule, default path is 'desktop' and only can
            // open directory.
            ipcMain.on('openDir', () => {
                dialog.showOpenDialog(
                    this.winMain!,
                    {
                        /* defaultPath: app.getPath('desktop'), */
                        defaultPath: 'D:\\dev\\AllNote',
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
                })
            })

           this.winMain!.webContents.on('context-menu', () => {
            console.log(webContents)
            const template: Electron.MenuItemConstructorOptions[] = [{
                role: 'editMenu'
        ];   
            
            const createContextMenu = () => {
                   return Menu.buildFromTemplate(
                        template
                   )
               }
             createContextMenu().popup()
           })

            // only for testing purpose, can be removed in release version
            ipcMain.on('test', (_event, data) => {
                console.log(data);
            })

        })
    }

    /**
     * @description not just main.js, other xxxModule will also have similar 
     * funcitons to handle responses or register shortcuts.
     */
    private _setListeners(): void {
        /**
         * @readonly comments for now, not convinent for develop.
         */
        // This catches any unhandle promise rejection errors.
        // process.on('unhandledRejection', (reason, p) => {
        //    console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`)
        // }) 
        
        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        })

        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user 
        // quits explicitly with Cmd + Q.
        app.on('window-all-closed', function () {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        })

        // Setting local shortcuts. Many thanks to ElectronLocalshortcut library
        app.whenReady().then(() => {

            /**
             * @readonly the following shortcuts mainly were disabled at first 
             * when the default menu were removed. Here is just to add them back 
             * individually.
             */

            // open developer tools
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+Shift+I', () => {
                this.winMain!.webContents.toggleDevTools();
            });

            // reload the page (NOT hard reload)
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+R', () => {
                this.winMain!.webContents.reload();
            });

            /**
             * @readonly the following shortcuts mainly controlling tabBar state.
             */

            // open the next tab, if reaches the end, move to the first
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+Tab', () => {
                this.winMain!.webContents.send('Ctrl+Tab');
            });

            // open the previous tab, if reaches the beginning, move to the end
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+Shift+Tab', () => {
                this.winMain!.webContents.send('Ctrl+Shift+Tab');
            });

            /**
             * @readonly handling current opened file close and write.
             */

            // close the current focused tab
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+W', () => {
                this.winMain!.webContents.send('Ctrl+W')
            })

            // save the current changes to the current focused tab
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+S', () => {
                this.winMain!.webContents.send('Ctrl+S');
            });

        });

    }

}

/** 
 * @readonly '❤hello, world!❤'
 */
new Main();

