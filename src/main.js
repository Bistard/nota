const OS = require('os');
const Electron = require('electron');
const { default : Vditor } = require('vditor');

const Notification = require('./js/notification');

function createWindow() {
    const WINDOW = new Electron.BrowserWindow({
        height: 800,
        width: 1200,
        minHeight: 400,
        minWidth: 600,

        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },

        show : false, 
        titleBarStyle: 'customButtonsOnHover', 
        frame: false
    });
    
    WINDOW.show();
    WINDOW.loadFile('./src/index.html');

    Electron.ipcMain.on('minApp', () => {
        WINDOW.minimize();
    })

    Electron.ipcMain.on('maxApp', () => {
        if (WINDOW.isMaximized()) {
            WINDOW.restore();
        } else {
            WINDOW.maximize();
        }
    })
    
    Electron.ipcMain.on('closeApp', () => {
        WINDOW.close();
    })
    
}

Electron.app.whenReady().then(() => {

    createWindow();



})

/* 
Electron.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
})

Electron.app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}) */