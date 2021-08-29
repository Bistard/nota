<<<<<<< HEAD:src/main.ts
import { IActionBarOptions } from "src/code/workbench/browser/actionBar/actionBar";

<<<<<<< HEAD
const { BrowserWindow, ipcMain, app, dialog, Menu } = require('electron')
const ElectronLocalshortcut = require('electron-localshortcut')
=======
import * as Path from'path';

import { BrowserWindow, ipcMain, app, dialog, Menu } from 'electron';
import * as ElectronLocalshortcut from 'electron-localshortcut';
>>>>>>> master

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
            
            ipcMain.on('showContextMenuEditor', () => {
                const template: Electron.MenuItemConstructorOptions[] = [
                    {role: 'editMenu'},
                    {label: 'Inspect', role: 'toggleDevTools'}
                ];
                Menu.buildFromTemplate(template).popup();
             });
 
            ipcMain.on('showContextMenuExplorer', () => {

                const template: Electron.MenuItemConstructorOptions[] = [
                    {label: 'New File'},
                    {label: 'New Folder'},
                    {type: 'separator'},
                    {label: 'Copy', role:'copy'},
                    {label: 'Paste', role: 'paste'},
                    {label: 'Cut', role: 'cut'},
                    {type: 'separator'},
                    {label: 'Rename'},
                    {label: 'Delete'},
                ];
                Menu.buildFromTemplate(template).popup();
            });

            /**
             * @readonly responses to the listener from actionBarComponent
             */
            ipcMain.on('showContextMenuActionBar', (_event, actionBarOpts: IActionBarOptions) => {
                
                const template: Electron.MenuItemConstructorOptions[] = [
                    {label: 'File Explorer', type: 'checkbox', checked: actionBarOpts.options[0],    
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "explorer-button", 0); }},
                    {label: 'Outline', type: 'checkbox', checked: actionBarOpts.options[1], 
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "outline-button", 1); }},
                    {label: 'Search', type: 'checkbox', checked: actionBarOpts.options[2],
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "search-button", 2); }},
                    {label: 'Git', type: 'checkbox', checked: actionBarOpts.options[3], 
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "git-button", 3); }},
                ];

                Menu.buildFromTemplate(template).popup();
            });
            
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
            });

           ipcMain.on('showContextMenu', () => {
               //this.winMain!.webContents.send('showContextMenu')
               const template: Electron.MenuItemConstructorOptions[] = [{
                role: 'editMenu',
            }]  
            
            const createContextMenu = () => {
                   return Menu.buildFromTemplate(
                        template
                   )
               }
             createContextMenu().popup()
           })

           ipcMain.on('showContextMenuView', () => {
            //this.winMain!.webContents.send('showContextMenu')
            const template: Electron.MenuItemConstructorOptions[] = [{
             role: 'fileMenu',
         }]  
         
         const createContextMenu = () => {
                return Menu.buildFromTemplate(
                     template
                )
            }
          createContextMenu().popup()
        })
/*
           this.winMain!.webContents.on('context-menu', () => {
            const template: Electron.MenuItemConstructorOptions[] = [{
                role: 'editMenu',
            }]  
            
            const createContextMenu = () => {
                   return Menu.buildFromTemplate(
                        template
                   )
               }
             createContextMenu().popup()
           })
*/
            // only for testing purpose, can be removed in release version
            ipcMain.on('test', (_event, data) => {
                console.log(data);
            });

        });
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
            });

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

=======
import { IActionBarOptions } from "src/code/workbench/browser/actionBar/actionBar";

import * as Path from'path';

import { BrowserWindow, ipcMain, app, dialog, Menu } from 'electron';
import * as ElectronLocalshortcut from 'electron-localshortcut';

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
            
            ipcMain.on('showContextMenuEditor', () => {
                const template: Electron.MenuItemConstructorOptions[] = [
                    {role: 'editMenu'},
                    {label: 'Inspect', role: 'toggleDevTools'}
                ];
                Menu.buildFromTemplate(template).popup();
             });
 
            ipcMain.on('showContextMenuExplorer', () => {

                const template: Electron.MenuItemConstructorOptions[] = [
                    {label: 'New File'},
                    {label: 'New Folder'},
                    {type: 'separator'},
                    {label: 'Copy', role:'copy'},
                    {label: 'Paste', role: 'paste'},
                    {label: 'Cut', role: 'cut'},
                    {type: 'separator'},
                    {label: 'Rename'},
                    {label: 'Delete'},
                ];
                Menu.buildFromTemplate(template).popup();
            });

            /**
             * @readonly responses to the listener from actionBarComponent
             */
            ipcMain.on('showContextMenuActionBar', (_event, actionBarOpts: IActionBarOptions) => {
                
                const template: Electron.MenuItemConstructorOptions[] = [
                    {label: 'File Explorer', type: 'checkbox', checked: actionBarOpts.options[0],    
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "explorer-button", 0); }},
                    {label: 'Outline', type: 'checkbox', checked: actionBarOpts.options[1], 
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "outline-button", 1); }},
                    {label: 'Search', type: 'checkbox', checked: actionBarOpts.options[2],
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "search-button", 2); }},
                    {label: 'Git', type: 'checkbox', checked: actionBarOpts.options[3], 
                        click: () => { this.winMain!.webContents.send('context-menu-command', actionBarOpts, "git-button", 3); }},
                ];

                Menu.buildFromTemplate(template).popup();
            });
            
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
            });

            // only for testing purpose, can be removed in release version
            ipcMain.on('test', (_event, data) => {
                console.log(data);
            });

        });
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
            });

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

>>>>>>> origin/master:src/code/electron-main/main.ts
