const { app, ipcRenderer }= require('electron')

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
class ConfigModule {
    constructor() {
        
        /**
         * @readonly used for file/folder reading and writing.
         */
        
        this.OpenDirConfig = {
            /* defaultPath: app.getPath('desktop'), */
            defaultPath: 'D:\\dev\\AllNote',
            buttonLabel: 'open a file or folder',
            properties: [
                /* 'openFile', */
                'openDirectory',
            ],
        }
        this.fileAutoSaveOn = true
        
        /**
         * @readonly titleBarView config
         */

        this.defaultMarkdownMode = 'wysiwyg'
        this.isToolBarExpand = true

        /**
         * @readonly markdownView config
         */
        this.markdownSpellCheckOn = false
        

    }

}

module.exports = { ConfigModule }
