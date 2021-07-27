const OS = require('os')
const path = require('path')

const Electron = require('electron')

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
        Electron.app.whenReady().then(() => {
            
            this.winMain = new Electron.BrowserWindow({
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
    
            this.winMain.webContents.on('did-finish-load', () => 
                this.winMain.show()
            )
    
            this.winMain.on('maximize', () => {
                this.winMain.webContents.send('isMaximized')
            })

            this.winMain.on('unmaximize', () => {
                this.winMain.webContents.send('isRestored')
            })

            this.winMain.on('closed', () => {
                this.winMain = null
            })

            /* testing purpose */
            Electron.ipcMain.on('test', (event, data) => {
                console.log(data)
            })

            Electron.ipcMain.on('minApp', () => {
                this.winMain.minimize()
            })

            Electron.ipcMain.on('maxResApp', () => {
                if (this.winMain.isMaximized()) {
                    this.winMain.restore()
                } else {
                    this.winMain.maximize()
                }
            })

            Electron.ipcMain.on('closeApp', () => {
                this.winMain.close()
            })

            Electron.ipcMain.on('openNewFolder', () => {
                Electron.dialog.showOpenDialog(
                    this.winMain,
                    this.ConfigModule.OpenFolderDialogConfig
                ).then((path) => {
                    if (!path.canceled) {
                        let rootdir = path.filePaths[0]
                        console.log("rootdir: ", rootdir)
                        this.winMain.webContents.send('openFolder', rootdir)
                    }
                })
            })
        })
    }

    setListeners() {
        // This catches any unhandle promise rejection errors
        process.on('unhandledRejection', (reason, p) => {
            console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`)
        })

        Electron.app.on('activate', function () {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (Electron.BrowserWindow.getAllWindows().length === 0) {
                createWindow()
            }
        })
    
        // Quit when all windows are closed, except on macOS. There, it's common
        // for applications and their menu bar to stay active until the user quits
        // explicitly with Cmd + Q.
        Electron.app.on('window-all-closed', function () {
            if (process.platform !== 'darwin') {
                Electron.app.quit()
            }
        })
    }

}

new Main()