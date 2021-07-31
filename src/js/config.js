const { app, ipcRenderer }= require('electron')

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

}

module.exports = { ConfigModule }
