const { app, ipcRenderer }= require('electron')

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
class ConfigModule {
    constructor() {
        this.OpenDirConfig = null
        this.initConfig()
    }

    initConfig() {
        
        this.OpenDirConfig = {
            /* defaultPath: app.getPath('desktop'), */
            // DEBUG: remove later
            defaultPath: 'D:\\dev\\AllNote',
            buttonLabel: 'open a file or folder',
            properties: [
                /* 'openFile', */
                'openDirectory',
            ],
        }

    }

}

module.exports = { ConfigModule }
