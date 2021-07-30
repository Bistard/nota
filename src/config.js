const { app, globalShortcut, ipcMain, ipcRenderer }= require('electron')

class ConfigModule {
    constructor() {
        this.OpenFolderDialogConfig = null
        this.initConfig()
    }

    initConfig() {
        
        this.OpenFolderDialogConfig = {
            /* defaultPath: app.getPath('desktop'), */
            defaultPath: 'D:\\dev\\AllNote',                          // DEBUG
            buttonLabel: 'open a file or folder',
            properties: [
                /* 'openFile', */
                'openDirectory',
            ],
        }

    }

    handleShortCut(event) {
        console.log(event.key)
    }
}

module.exports = { ConfigModule }
