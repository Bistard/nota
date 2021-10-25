import { MarkdownRenderMode } from 'mdnote';
import { pathJoin } from 'src/base/common/string';
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from 'src/base/electron/app';
import { createFile, isFileExisted, readFromFileSync, writeToFile } from 'src/base/node/io';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';

export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;

export const DEFAULT_CONFIG_FILE_NAME = 'config.json';
export const LOCAL_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'mdnote.config.json';

export const IConfigService = createDecorator<IConfigService>('config-service');

export interface IConfigService {
    init(path: string): Promise<void>;
    readFromJSON(path: string, fileName: string): Promise<void>;
    writeToJSON(path: string, fileName: string): Promise<void>;
}

/**
 * @description config module to store 'local' or 'default' configuration.
 */
export class ConfigService implements IConfigService {
    
    constructor() {}

    /**
     * @description reads or creates a config.json file in the given 
     * path, then creates the singleton instance of a ConfigService.
     * 
     * @param path eg. D:\dev\AllNote
     */
    public async init(path: string): Promise<void> {
        try {
            if (await isFileExisted(path, DEFAULT_CONFIG_FILE_NAME) === false) {
                await createFile(path, DEFAULT_CONFIG_FILE_NAME);
                await this.writeToJSON(path, DEFAULT_CONFIG_FILE_NAME);
            } else {
                await this.readFromJSON(path, DEFAULT_CONFIG_FILE_NAME);
            }
        } catch(err) {
            throw err;
        }
    }

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        try {
            const text = readFromFileSync(pathJoin(path, fileName));
            const jsonObject: Object = JSON.parse(text);
            Object.assign(this, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
        }
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        try {
            writeToFile(path, fileName, JSON.stringify(this, null, 2));
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