import { Emitter, Register } from "src/base/common/event";
import { resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from "src/base/electron/app";
import { MarkdownRenderMode } from "src/code/browser/workbench/editor/markdown/markdown";
import { ConfigModel, IConfigType } from "src/code/common/service/configService/configModel";
import { ConfigServiceBase, IConfigService } from "src/code/common/service/configService/configServiceBase";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { Language } from "src/code/platform/i18n/i18n";

export const LOCAL_NOTA_DIR_NAME = '.nota';
export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;
export const DEFAULT_CONFIG_FILE_NAME = 'user.config.json';
export const LOCAL_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'nota.config.json';

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
 * @class The user configuration service relates to the unique file named
 * `user.config.json` which will be placed in the .nota directory that either:
 *      - in the opened directory (user customized) OR
 *      - in the root directory of the application which will be considered as 
 *        the default user configuration path.
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
 * @class The global configuration service relates to the unique file named
 * `nota.config.json` which will be placed in the .noda folder in the root 
 * directory of the application.
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
 * 'nota.config.json' at the root directory of the application.
 */
function getDefaultGlobalConfigPath(): URI {
    return URI.fromFile(resolve(APP_ROOT_PATH, LOCAL_NOTA_DIR_NAME, GLOBAL_CONFIG_FILE_NAME));
}

function getDefaultUserConfigPath(): URI {
    return URI.fromFile(resolve(APP_ROOT_PATH, LOCAL_NOTA_DIR_NAME, DEFAULT_CONFIG_FILE_NAME));
}

/*******************************************************************************
 * Default Configurations
 ******************************************************************************/

/**
 * The @SettingSection is a set of section paths that global/user default configuration 
 * (see {@link DefaultGlobalConfigModel} and {@link DefaultUserConfigModel})
 * will obtain as default. 
 * 
 * Each section path corresponds to a @SettingInterface which is a javascript 
 * object that represents the type of the object in that specific section path.
 * 
 * See related usages in `configService.test.ts`.
 */

/*******************************************************************************
 * @readonly Global Configurations
 ******************************************************************************/

/** @SettingSection */
export const enum EGlobalSettings {

    /** {@link IGlobalApplicationSettings} */
    Application = 'application',

    /** {@link IGlobalNotebookManagerSettings} */
    NotebookManager = 'notebookManager',

}

/** @SettingInterface */
export interface IGlobalApplicationSettings {
    
    /**
     * The current application mode.
     */
    appMode: AppMode;

    /**
     * The current display language.
     */
    displayLanguage: Language,
    
    /**
     * When true, NoteBookManager will read or create the default configuration in 
     * '<appRootPath>/.nota/user.config.json'.
     * 
     * When false, NoteBookManager will read or create a local configuration file 
     * in '<notebookManagerPath>/.nota/config.json'.
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
     * When the application started, determine whether to open the previous 
     * opened directory.
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
                displayLanguage: 'en',
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
            'notebookManager': 
            {
                startPreviousNoteBookManagerDir: true,
                previousNoteBookManagerDir: '',
            }
        };
    }
}

/*******************************************************************************
 * @readonly User Configurations
 ******************************************************************************/

/** @SettingSection */
export const enum EUserSettings {
    
    /** {@link IUserNotebookManagerSettings} */
    NotebookManager = 'notebookManager',

    /** {@link IUserMarkdownSettings} */
    Markdown = 'markdown',

}

/** @SettingInterface */
export interface IUserNotebookManagerSettings {

    /**
     * To excludes files, please use regular expression form.
     * @note This has lower priority than 'noteBookManagerInclude'.
     */
    noteBookManagerExclude: string[];
    
    /**
     * To includes files, please use regular expression form.
     * @note This has higher priority than 'noteBookManagerExclude'.
     */
    noteBookManagerInclude: string[];    
}

/** @SettingInterface */
export interface IUserMarkdownSettings {

    /** 
     * auto file save option 
     */
    fileAutoSaveOn: boolean;
    
    /** 
     * the default markdown render mode every time when the applicaiton starts 
     */
    defaultMarkdownMode: MarkdownRenderMode;
}

export class DefaultUserConfigModel extends ConfigModel {

    constructor() {
        super();
        this.__setObject(this.createDefault());
        
    }

    private createDefault(): any {
        return {
            'notebookManager': 
            {
                noteBookManagerExclude: [
                    '^\\..*',
                ] as string[],
                noteBookManagerInclude: [

                ] as string[],
            },
            'markdown':
            {
                fileAutoSaveOn: false,
                defaultMarkdownMode: 'wysiwyg' as MarkdownRenderMode,
            }
        };
    }

}