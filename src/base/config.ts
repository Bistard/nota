import { MarkdownRenderMode } from 'mdnote';

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
export class ConfigModule {

    /**
     * @readonly used for file/folder reading and writing.
     */

    public static startWithPreviousNoteBookDir: boolean = false;
    
    public static OpenDirConfig: Electron.OpenDialogOptions = {
        /* defaultPath: app.getPath('desktop'), */
        defaultPath: 'D:\\dev\\AllNote',
        buttonLabel: 'open a file or folder',
        properties: [
            /* 'openFile', */
            'openDirectory',
        ],
    };

    /**
     * @readonly if wants to excludes file, remember to add file format.
     * eg. 'config.json'. This has lower priority than 'parserIncludeDir'.
     * 
     * '.*' represents any folders starts with '.'.
     */
    public static parserExcludeDir: string[] = [
        '.*',
    ];

    /**
     * @readonly if wants to includes file, remember to add file format such as
     * 'config.json'. This has higher priority than 'parserExcludeDir'.
     */
    public static parserIncludeDir: string[] = [
        
    ];

    public static fileAutoSaveOn: boolean = true;
    
    /**
     * @readonly titleBarView config
     */

    
    public static isToolBarExpand: boolean = true;
    public static isMarkdownToolExpand: boolean = false;

    /**
     * @readonly markdownView config
     */
    public static defaultMarkdownMode: MarkdownRenderMode = 'wysiwyg';
    public static markdownSpellCheckOn: boolean = false;

}