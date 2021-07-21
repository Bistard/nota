const Electron = require('electron');
const Vditor = require('vditor');

const Notification = require('./js/notification');

function createWindow() {
    const WINDOW = new Electron.BrowserWindow({
        width: 800,
        height: 600
    });

    WINDOW.loadFile('./src/index.html');
}

Electron.app.whenReady().then(() => {
    
    createWindow();
    
    Electron.app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

})


