const OS = require('os')
const path = require('path')

const { BrowserWindow, ipcMain, app, dialog } = require('electron')
const ElectronLocalshortcut = require('electron-localshortcut')

const Notification = require('./js/notification')
const ConfigModule = require('./config')

class Main {
    
    constructor() {
        this.ConfigModule = new ConfigModule.ConfigModule()
        this.winMain = null
        this.createWindow()
        this.setListeners()
    }

    createWindow() {
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
                    preload: path.join(__dirname + '/js', 'preload.js')
                },
        
                show: false,
                frame: false
            })
    
            global.winMain = this.winMain
            this.winMain.loadFile('./src/index.html')
    
            this.winMain.webContents.on('did-finish-load', () => {
                this.winMain.show()
            })
    
            this.winMain.on('maximize', () => {
                this.winMain.webContents.send('isMaximized')
            })

            this.winMain.on('unmaximize', () => {
                this.winMain.webContents.send('isRestored')
            })

            this.winMain.on('closed', () => {
                this.winMain = null
            })

            ipcMain.on('minApp', () => {
                this.winMain.minimize()
            })

            ipcMain.on('maxResApp', () => {
                if (this.winMain.isMaximized()) {
                    this.winMain.restore()
                } else {
                    this.winMain.maximize()
                }
            })

            ipcMain.on('closeApp', () => {
                this.winMain.close()
            })

            ipcMain.on('openNewFolder', () => {
                dialog.showOpenDialog(
                    this.winMain,
                    this.ConfigModule.OpenFolderDialogConfig
                ).then((path) => {
                    if (!path.canceled) {
                        let rootdir = path.filePaths[0]
                        this.winMain.webContents.send('openFolder', rootdir)
                    }
                })
            })
            
            /* testing purpose */
            ipcMain.on('test', (event, data) => {
                console.log(data)
            })

        })
    }

    setListeners() {
        // This catches any unhandle promise rejection errors
        process.on('unhandledRejection', (reason, p) => {
            console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`)
        })

        app.on('activate', function () {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow()
            }
        })
    
        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        app.on('window-all-closed', function () {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })
        
        // set local shortcuts
        app.whenReady().then(() => {
            ElectronLocalshortcut.register(this.winMain, 'Ctrl+Tab', () => {
                this.winMain.webContents.send('Ctrl+Tab')
            })

            ElectronLocalshortcut.register(this.winMain, 'Ctrl+Shift+Tab', () => {
                this.winMain.webContents.send('Ctrl+Shift+Tab')
            })

            ElectronLocalshortcut.register(this.winMain, 'Ctrl+S', () => {
                this.winMain.webContents.send('Ctrl+S')
            })

            ElectronLocalshortcut.register(this.winMain, 'Ctrl+W', () => {
                this.winMain.webContents.send('Ctrl+W')
            })
        })

    }

}

new Main()

