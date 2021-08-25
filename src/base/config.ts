import { MarkdownRenderMode } from 'mdnote';
import { pathJoin } from 'src/base/common/string';
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from 'src/base/electron/app';
import { readFromFileSync, writeToFile } from 'src/base/node/file';

export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;

export const DEFAULT_CONFIG_FILE_NAME = 'config.json';
export const LOCAL_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'mdnote.config.json';

interface IConfigModule {
    readFromJSON(path: string, fileName: string): Promise<void>;
    writeToJSON(path: string, fileName: string): Promise<void>;
}

/**
 * @description config module to store 'local' or 'default' configuration.
 */
export class ConfigModule implements IConfigModule {

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

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        try {
            const text = readFromFileSync(pathJoin(path, fileName));
            const jsonObject: Object = JSON.parse(text);
            Object.assign(ConfigModule.Instance, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
        }
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        try {
            writeToFile(path, fileName, JSON.stringify(ConfigModule.Instance, null, 2));
        } catch(err) {
            // do log here
        }
    }

    /***************************************************************************
     *                            Config Settings
     **************************************************************************/

    /**
     * @readonly used for file/directory reading and writing.
     */
    
    public OpenDirConfig: Electron.OpenDialogOptions = {
        defaultPath: DESKTOP_ROOT_PATH,
        // defaultPath: 'D:\\dev\\AllNote',
        buttonLabel: 'select a directory',
        properties: [
            /* 'openFile', */
            'openDirectory',
        ],
    };
    
    /**
     * If wants to excludes file, remember to add file format.
     * eg. 'config.json'. This has lower priority than 'noteBookManagerInclude'.
     * 
     * '.*' represents any folders starts with '.'.
     */
    public noteBookManagerExclude: string[] = [
        '.*',
    ];

    /**
     * If wants to includes file, remember to add file format such as
     * 'config.json'. This has higher priority than 'noteBookManagerExclude'.
     */
    public noteBookManagerInclude: string[] = [

    ];

    public fileAutoSaveOn: boolean = true;
    
    public defaultMarkdownMode: MarkdownRenderMode = 'wysiwyg';
    public markdownSpellCheckOn: boolean = false;

}

/**
 * @description 'global' config module stores configuration that only stored at
 * application root path.
 */
export class GlobalConfigModule implements IConfigModule {

    /***************************************************************************
     *                               singleton
     **************************************************************************/
    
    private static _instance: GlobalConfigModule;

    private constructor() {}

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    private static set Instance(object) {
        this._instance = object;
    }

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        try {
            const text = readFromFileSync(pathJoin(path, fileName));
            const jsonObject: Object = JSON.parse(text);
            Object.assign(GlobalConfigModule.Instance, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
        }
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        try {
            writeToFile(path, fileName, JSON.stringify(GlobalConfigModule.Instance, null, 2));
        } catch(err) {
            // do log here
        }
    }

    /***************************************************************************
     *                        Global Config Settings
     **************************************************************************/

     public startPreviousNoteBookManagerDir: boolean = true;
     public previousNoteBookManagerDir: string = '';

    /**
     * If true, NoteBookManager will take the default config in '<appRootPath>/config.json'.
     * If false, NoteBookManager will create a local conig in '.mdnote/config.json'.
     * 
     */
    public defaultConfigOn: boolean = false;

}