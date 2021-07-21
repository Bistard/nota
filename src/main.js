const { app, BrowserWindow } = require('electron')
const { default: Vditor } = require('vditor')



function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600
    })

    window.loadFile('./src/index.html')

}

app.whenReady().then(() => {
    createWindow()
    
})