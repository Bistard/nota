import { MarkdownRenderMode } from 'mdnote';
import { pathJoin } from 'src/base/common/string';
import { readFromFileSync, writeToFile } from 'src/base/node/file';

/**
 * @description config module. Only for storing some default data, config or 
 * settings.
 */
export class ConfigModule {

    /***************************************************************************
     *                               singleton
     **************************************************************************/
    
    private static _instance: ConfigModule;

    private constructor() {}

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private static set Instance(object) {
        this._instance = object;
    }

    /***************************************************************************
     *                            static function
     **************************************************************************/

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        const text = readFromFileSync(pathJoin(path, fileName));
        const jsonObject: Object = JSON.parse(text);
        ConfigModule.Instance = jsonObject as ConfigModule;
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        writeToFile(path, fileName, JSON.stringify(ConfigModule.Instance, null, 2));
    }

    /***************************************************************************
     *                            Config Settings
     **************************************************************************/

    /**
     * @readonly used for file/folder reading and writing.
     */

    public startWithPreviousNoteBookDir: boolean = false;
    
    public OpenDirConfig: Electron.OpenDialogOptions = {
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
    public parserExcludeDir: string[] = [
        '.*',
    ];

    /**
     * @readonly if wants to includes file, remember to add file format such as
     * 'config.json'. This has higher priority than 'parserExcludeDir'.
     */
    public parserIncludeDir: string[] = [
        
    ];

    public fileAutoSaveOn: boolean = true;
    
    /**
     * @readonly titleBarView config
     */

    public isToolBarExpand: boolean = true;
    public isMarkdownToolExpand: boolean = false;

    /**
     * @readonly markdownView config
     */
    
    public defaultMarkdownMode: MarkdownRenderMode = 'wysiwyg';
    public markdownSpellCheckOn: boolean = false;

}