const OS = require('os')
const path = require('path')

const Electron = require('electron')

const Notification = require('./js/notification')
const Config = require('./config')

function createMainApp(width, height) {
    const winMain = new Electron.BrowserWindow({
        width: width,
        height: height,
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

    winMain.loadFile('./src/index.html')

    winMain.once('ready-to-show', () => {
        /* Electron.dialog.showOpenDialog() */
        winMain.show()
    })

    /* testing purpose */
    Electron.ipcMain.on('test', (event, data) => {
        console.log(data)
    })

    Electron.ipcMain.on('minApp', () => {
        winMain.minimize()
    })

    Electron.ipcMain.on('maxResApp', () => {
        if (winMain.isMaximized()) {
            winMain.restore()
        } else {
            winMain.maximize()
        }
    })

    winMain.on('maximize', () => {
        winMain.webContents.send('isMaximized')
    })

    winMain.on('unmaximize', () => {
        winMain.webContents.send('isRestored')
    })

    Electron.ipcMain.on('closeApp', () => {
        winMain.close()
    })

    Electron.ipcMain.on('openNewFolder', () => {
        Electron.dialog.showOpenDialog(
            winMain,
            Config.OpenFolderDialogConfig
        ).then((path) => {
            if (!path.canceled) {
                let rootdir = path.filePaths[0]
                winMain.webContents.send('openFolder', rootdir)
            }
        })
    })

    return winMain
}

Electron.app.whenReady().then(() => {

    const winMain = createMainApp(1200, 800)

    Electron.app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (Electron.BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

    // This catches any unhandle promise rejection errors
    process.on('unhandledRejection', (reason, p) => {
        console.error(`Unhandled Rejection at: ${util.inspect(p)} reason: ${reason}`)
    })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
Electron.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        Electron.app.quit()
    }
})
