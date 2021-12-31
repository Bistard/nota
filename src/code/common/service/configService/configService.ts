import { Emitter, Register } from "src/base/common/event";
import { resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from "src/base/electron/app";
import { MarkdownRenderMode } from "src/code/browser/workbench/editor/markdown/markdown";
import { ConfigModel, IConfigType } from "src/code/common/service/configService/configModel";
import { ConfigServiceBase, IConfigService } from "src/code/common/service/configService/configServiceBase";
import { IFileService } from "src/code/common/service/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;
export const DEFAULT_CONFIG_FILE_NAME = 'config.json';
export const LOCAL_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'mdnote.config.json';

export type AppMode = 'debug' | 'release';

export const IUserConfigService = createDecorator<IUserConfigService>('user-config-service');
export const IGlobalConfigService = createDecorator<IGlobalConfigService>('global-config-service');

export interface IUserConfigService extends IConfigService {
    
    onDidChangeMarkdownSettings: Register<IUserMarkdownSettings>;
    onDidChangeNotebookManagerSettings: Register<IUserNotebookManagerSettings>;

}
export interface IGlobalConfigService extends IConfigService {

    onDidChangeApplicationSettings: Register<IGlobalApplicationSettings>;
    onDidChangeNotebookManagerSettings: Register<IGlobalNotebookManagerSettings>;

}

/**
 * @description The user configuration service relates to the unique file named
 * `config.json` which will be placed in either:
 *      - the .mdnote directory in the opened directory (user customized) OR
 *      - the root directory of the application which will be considered as the 
 *        default user configuration.
 */
export class UserConfigService extends ConfigServiceBase implements IUserConfigService {

    /* EUserSettings Events */
    private readonly _onDidChangeMarkdownSettings = this.__register( new Emitter<IUserMarkdownSettings>() );
    public readonly onDidChangeMarkdownSettings = this._onDidChangeMarkdownSettings.registerListener;

    private readonly _onDidChangeNotebookManagerSettings = this.__register( new Emitter<IUserNotebookManagerSettings>() );
    public readonly onDidChangeNotebookManagerSettings = this._onDidChangeNotebookManagerSettings.registerListener;
    
    constructor(
        @IFileService fileService: IFileService
    ) {
        super(IConfigType.USER, new DefaultUserConfigModel(), fileService);
    }

    public override async init(path: URI = getDefaultUserConfigPath()): Promise<void> {
        return await super.init(path);
    }

    /** @override */
    protected override __fireOnSpecificEvent(section: EUserSettings, change: any): void {
        switch (section) 
        {
            case EUserSettings.Markdown:
                this._onDidChangeMarkdownSettings.fire(change);
                break;
            case EUserSettings.NotebookManager:
                this._onDidChangeNotebookManagerSettings.fire(change);
                break;
        }
    }
}

/**
 * @description The global configuration service relates to the unique file named
 * `mdnote.config.json` which will be placed in the root directory of the 
 * application.
 */
export class GlobalConfigService extends ConfigServiceBase implements IGlobalConfigService {

    /* EGlobalSettings Events */
    private readonly _onDidChangeApplicationSettings = this.__register( new Emitter<IGlobalApplicationSettings>() );
    public readonly onDidChangeApplicationSettings = this._onDidChangeApplicationSettings.registerListener;

    private readonly _onDidChangeNotebookManagerSettings = this.__register( new Emitter<IGlobalNotebookManagerSettings>() );
    public readonly onDidChangeNotebookManagerSettings = this._onDidChangeNotebookManagerSettings.registerListener;

    constructor(
        @IFileService fileService: IFileService
    ) {
        super(IConfigType.GLOBAL, new DefaultGlobalConfigModel(), fileService);
    }

    public override async init(path: URI = getDefaultGlobalConfigPath()): Promise<void> {
        return await super.init(path);
    }

    /** @override */
    protected override __fireOnSpecificEvent(section: EGlobalSettings, change: any): void {
        switch (section) 
        {
            case EGlobalSettings.Application:
                this._onDidChangeApplicationSettings.fire(change);
                break;
            case EGlobalSettings.NotebookManager:
                this._onDidChangeNotebookManagerSettings.fire(change);
                break;
        }
    }
}

/**
 * @readonly Returns a default URI path of the global config file which is named 
 * 'mdnote.config.json' at the root directory of the application.
 */
export function getDefaultGlobalConfigPath(): URI {
    return URI.fromFile(resolve(APP_ROOT_PATH, GLOBAL_CONFIG_FILE_NAME));
}

export function getDefaultUserConfigPath(): URI {
    return URI.fromFile(resolve(APP_ROOT_PATH, DEFAULT_CONFIG_FILE_NAME));
}

/*******************************************************************************
 * Default Configurations
 ******************************************************************************/

/**
 * The @SettingSection is a set of section paths that global/user default configuration 
 * (see `DefaultGlobalConfigModel` and `DefaultUserConfigModel`) will obtain as
 * default. Each section path corresponds to a @SettingInterface which is a 
 * interface that represents the type of the object in that specific section path.
 * 
 * See related usages in `configService.test.ts`.
 */

/**
 * @readonly Global Configurations
 */

/** @SettingSection */
export enum EGlobalSettings {

    Application = 'application',
    NotebookManager = 'notebookmanager',

}

/** @SettingInterface */
export interface IGlobalApplicationSettings {
    
    /**
     * The current application mode.
     */
    appMode: AppMode;
    
    /**
     * When true, NoteBookManager will read or create the default configuration in 
     * '<appRootPath>/config.json'.
     * 
     * When false, NoteBookManager will read or create a local configuration file 
     * in '<notebookManagerPath>/.mdnote/config.json'.
     */
    defaultConfigOn: boolean;

    /**
     * Used for file/directory reading and writing.
     */
    OpenDirConfig: Electron.OpenDialogOptions;
}

/** @SettingInterface */
export interface IGlobalNotebookManagerSettings {

    /**
     * A boolean to determine whether opened the previous opened notebook manager directory.
     */
    startPreviousNoteBookManagerDir: boolean;
    
    /**
     * Stores the previous opened notebook manager directory path.
     */
    previousNoteBookManagerDir: string;
}

export class DefaultGlobalConfigModel extends ConfigModel {
    
    constructor() {
        super();
        this.__setObject(this.createDefault());
    }

    private createDefault(): any {
        return {
            'application':
            {
                appMode: 'debug' as AppMode,
                defaultConfigOn: false,
                OpenDirConfig:  {
                    defaultPath: DESKTOP_ROOT_PATH,
                    buttonLabel: 'select a directory',
                    properties: [
                        /* 'openFile', */
                        'openDirectory'
                    ]
                } as Electron.OpenDialogOptions,
            },
            'notebookmanager': 
            {
                startPreviousNoteBookManagerDir: true,
                previousNoteBookManagerDir: '',
            }
        };
    }
}

/**
 * @readonly User Configurations
 */

/** @SettingSection */
export enum EUserSettings {
    
    NotebookManager = 'notebookmanager',
    Markdown = 'markdown',

}

/** @SettingInterface */
export interface IUserNotebookManagerSettings {

    /**
     * If wants to excludes file, remember to add file format.
     * eg. 'config.json'. This has lower priority than 'noteBookManagerInclude'.
     * 
     * '.*' represents any folders starts with '.'.
     */
    noteBookManagerExclude: string[];
    
    /**
     * If wants to includes file, remember to add file format such as
     * 'config.json'. This has higher priority than 'noteBookManagerExclude'.
     */
    noteBookManagerInclude: string[];    
}

/** @SettingInterface */
export interface IUserMarkdownSettings {
    /** auto file save option */
    fileAutoSaveOn: boolean;
    
    /** the default markdown render mode every time when the applicaiton starts */
    defaultMarkdownMode: MarkdownRenderMode;
}

export class DefaultUserConfigModel extends ConfigModel {

    constructor() {
        super();
        this.__setObject(this.createDefault());
        
    }

    private createDefault(): any {
        return {
            'notebookmanager': 
            {
                noteBookManagerExclude: [
                    '.*',
                ] as string[],
                noteBookManagerInclude: [

                ] as string[],
            },
            'markdown':
            {
                fileAutoSaveOn: true,
                defaultMarkdownMode: 'wysiwyg' as MarkdownRenderMode,
            }
        };
    }

}