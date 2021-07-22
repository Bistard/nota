const OS = require('os');
const path = require('path');
const Electron = require('electron');
const { default : Vditor } = require('vditor');

const Notification = require('./js/notification');
const leftOutline = require('./js/leftOutline');

function createMainApp(width, height) {
    const winMain = new Electron.BrowserWindow({
        width: width,
        height: height,
        minWidth: 600,
        minHeight: 400,
        
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },

        show : false, 
        frame: false
    });

    const view = new Electron.BrowserView();
    winMain.setBrowserView(view);
    view.setBounds( {x:0, y:0, width:300, height:300 } );
    view.webContents.loadURL('https://electronjs.org');
    
    winMain.loadFile('./src/index.html');
    winMain.once('ready-to-show', () => {
        winMain.show();
    })

    Electron.ipcMain.on('minApp', () => {
        winMain.minimize();
    })

    Electron.ipcMain.on('maxApp', () => {
        if (winMain.isMaximized()) {
            winMain.restore();
        } else {
            winMain.maximize();
        }
    })
    
    Electron.ipcMain.on('closeApp', () => {
        winMain.close();
    })
    
    return winMain;
}

Electron.app.whenReady().then(() => {

    const winMain = createMainApp(1200, 800);

    Electron.app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (Electron.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
Electron.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        Electron.app.quit();
    }
})