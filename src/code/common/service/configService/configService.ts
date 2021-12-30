import { Disposable } from 'src/base/common/dispose';
import { Emitter, Register } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from 'src/base/common/file/uri';
import { pathJoin } from 'src/base/common/string';
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from 'src/base/electron/app';
import { createFile, isFileExisted, readFromFileSync, writeToFile } from 'src/base/node/io';
import { MarkdownRenderMode } from 'src/code/browser/workbench/editor/markdown/markdown';
import { DefaultGlobalConfigModel, DefaultUserConfigModel, IConfigChange, IConfigChangeEvent, IConfigModel, IConfigType } from 'src/code/common/service/configService/configModel';
import { IFileService } from 'src/code/common/service/fileService';
import { createDecorator } from 'src/code/common/service/instantiationService/decorator';

export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;

export const DEFAULT_CONFIG_FILE_NAME = 'config.json';
export const LOCAL_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'mdnote.config.json';

export const IConfigService = createDecorator<IConfigService>('config-service');

export interface IConfigService {
    
    readonly onDidChangeConfiguration: Register<IConfigChangeEvent>;

    get<T>(section: string | undefined): T | undefined;
    
    set(sections: string[] | undefined, values: any[]): Error[];
    set(section: string | undefined, value: any): Error;
    set(arg1: any, arg2: any): Error[] | Error;

    init(path: URI): Promise<void>;
    save(path: URI, model: IConfigModel): Promise<void>;
    read(path: URI): Promise<void>;

}

export abstract class ConfigServiceBase extends Disposable implements IConfigService {

    /* Events */

    private readonly _onDidChangeConfiguration = this.__register( new Emitter<IConfigChangeEvent>() );
    public readonly onDidChangeConfiguration = this._onDidChangeConfiguration.registerListener;

    constructor(
        protected readonly configType: IConfigType,
        protected readonly configModel: IConfigModel,
        protected readonly fileService: IFileService
    ) {
        super();
    }

    public get<T>(section: string | undefined): T | undefined {
        return this.configModel.get<T>(section);
    }

    public set(sections: string[] | undefined, values: any[]): Error[];
    public set(section: string | undefined, value: any): Error;
    public set(arg1: any, arg2: any): Error[] | Error {

        const errors: Error[] = [];
        
        if (Array.isArray(arg1) && Array.isArray(arg2)) {

            const changeKeys: string[] = [];

            for (let i = 0; i < arg1.length; i++) {
                try {
                    this.configModel.set(arg1[i], arg2[i]);
                    changeKeys.push(arg1[i]);
                } catch (err) {
                    errors.push(err as Error);
                }
            }

            this.__fireOnDidChangeConfiguration(this.configType, { keys: changeKeys });
        }
        
        else {
            try {
                this.configModel.set(arg1, arg2);
            } catch (err) {
                errors.push(err as Error);
            }
            
            if (errors.length === 0) {
                this.__fireOnDidChangeConfiguration(this.configType, { keys: [arg1] });
            }
        }

        if (errors.length === 1) {
            return errors[0]!;
        } else {
            return errors;
        }
    }

    public async init(path: URI): Promise<void> {

        try {
            if (await this.fileService.exist(path) === false) {
                await this.fileService.createFile(path, DataBuffer.alloc(0));
                await this.save(path, this.configModel);
            } else {
                await this.read(path);
            }
        } 
        
        catch (err) {
            throw err;
        }

    }

    public async save(path: URI, model: IConfigModel): Promise<void> {
        try {
            this.fileService.writeFile(path, DataBuffer.fromString(JSON.stringify(model.object, null, 2 /* indentation space */)));
        } catch(err) {
            throw new Error(`cannot save configuration to: ${path.toString()}`);
        }
    }

    public async read(path: URI): Promise<void> {
        try {
            const textBuffer = this.fileService.readFile(path);
            const jsonObject: Object = JSON.parse((await textBuffer).toString());
            Object.assign(this, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
            throw new Error(`cannot read configuration from: ${path.toString()}`);
        }
    }

    private __fireOnDidChangeConfiguration(type: IConfigType, changes: IConfigChange) {
        this._onDidChangeConfiguration.fire( {type: type, changes: changes} );
    }
}

export class UserConfigService extends ConfigServiceBase {

    constructor(
        @IFileService fileService: IFileService
    ) {
        super(IConfigType.USER, new DefaultUserConfigModel(), fileService);
    }

}


export class GlobalConfigService extends ConfigServiceBase {

    constructor(
        @IFileService fileService: IFileService
    ) {
        super(IConfigType.USER, new DefaultGlobalConfigModel(), fileService);
    }

}


/**
 * @description config module to store 'local' or 'default' configuration.
 */
export class ConfigService {
    
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