import { MarkdownRenderMode } from 'mdnote';

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
export class ConfigModule {

    /**
     * @readonly used for file/folder reading and writing.
     */
    
    public static OpenDirConfig: Electron.OpenDialogOptions = {
        /* defaultPath: app.getPath('desktop'), */
        defaultPath: 'D:\\dev\\AllNote',
        buttonLabel: 'open a file or folder',
        properties: [
            /* 'openFile', */
            'openDirectory',
        ],
    };

    public static fileAutoSaveOn: boolean = true;
    
    /**
     * @readonly titleBarView config
     */

    public static defaultMarkdownMode: MarkdownRenderMode = 'wysiwyg';

    public static isToolBarExpand: boolean = true;

    /**
     * @readonly markdownView config
     */
    public static markdownSpellCheckOn: boolean = false;

}