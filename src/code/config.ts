type markdownRenderMode = 'wysiwyg' | 'instant' | 'split';

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
export class ConfigModule {

    /**
     * @readonly used for file/folder reading and writing.
     */
    
    public OpenDirConfig: Electron.OpenDialogOptions;

    public fileAutoSaveOn: boolean;
    
    /**
     * @readonly titleBarView config
     */

    public defaultMarkdownMode: markdownRenderMode;

    public isToolBarExpand: boolean;

    /**
     * @readonly markdownView config
     */
    public markdownSpellCheckOn: boolean;
    
    constructor() {
        
        this.OpenDirConfig = {
            /* defaultPath: app.getPath('desktop'), */
            defaultPath: 'D:\\dev\\AllNote',
            buttonLabel: 'open a file or folder',
            properties: [
                /* 'openFile', */
                'openDirectory',
            ],
        }
        this.fileAutoSaveOn = true;
        this.defaultMarkdownMode = 'wysiwyg';
        this.isToolBarExpand = true;
        this.markdownSpellCheckOn = false;
    }

}