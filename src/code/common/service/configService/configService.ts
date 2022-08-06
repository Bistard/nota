import { Emitter, Register } from "src/base/common/event";
import { join, resolve } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { APP_ROOT_PATH, DESKTOP_ROOT_PATH } from "src/base/electron/app";
import { MarkdownRenderMode } from "src/code/browser/workbench/workspace/markdown/markdown";
import { ConfigModel, IConfigType } from "src/code/common/service/configService/configModel";
import { ConfigServiceBase, IConfigService } from "src/code/common/service/configService/configServiceBase";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { Language } from "src/code/platform/i18n/i18n";

export const NOTA_DIR_NAME = '.nota';
export const DEFAULT_CONFIG_PATH = APP_ROOT_PATH;
export const GLOBAL_CONFIG_PATH = APP_ROOT_PATH;
export const DEFAULT_CONFIG_FILE_NAME = 'user.config.json';
export const USER_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'nota.config.json';

export type AppMode = 'debug' | 'release';

export const IUserConfigService = createDecorator<IUserConfigService>('user-config-service');
export const IGlobalConfigService = createDecorator<IGlobalConfigService>('global-config-service');

export interface IUserConfigService extends IConfigService {
    
    onDidChangeMarkdownSettings: Register<IUserMarkdownSettings>;
    onDidChangeNotebookManagerSettings: Register<IUserNotebookManagerSettings>;

    /**
     * @description Validate the folder structure named {@link NOTA_DIR_NAME} 
     * under the opening directory in the explorer view. If missing any directory 
     * it will recreate them. If defaultConfigOn sets to false and we found a 
     * {@link USER_CONFIG_FILE_NAME}, we will read it into the memory instead 
     * using the default one.
     * @param path The path of the opening directory.
     * @param defaultConfigOn Check if we are using the local user configuration.
     */
    validateLocalUserDirectory(path: string, defaultConfigOn: boolean): Promise<void>;

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

    // [event]

    /* EUserSettings Events */
    private readonly _onDidChangeMarkdownSettings = this.__register( new Emitter<IUserMarkdownSettings>() );
    public readonly onDidChangeMarkdownSettings = this._onDidChangeMarkdownSettings.registerListener;

    private readonly _onDidChangeNotebookManagerSettings = this.__register( new Emitter<IUserNotebookManagerSettings>() );
    public readonly onDidChangeNotebookManagerSettings = this._onDidChangeNotebookManagerSettings.registerListener;
    
    // [constructor]

    constructor(
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super(IConfigType.USER, new DefaultUserConfigModel(), fileService, logService);
    }

    // [public method]

    public override async init(path: URI): Promise<void> {
        path = __getUserConfigResourcePath(path);
        return await super.init(path);
    }

    public async validateLocalUserDirectory(path: string, defaultConfigOn: boolean): Promise<void> {

        path = resolve(path, NOTA_DIR_NAME);

        // validate the folder `.nota`
        await this.__validateLocalUserDirectory(path);
        
        const configPath = URI.fromFile(resolve(path, USER_CONFIG_FILE_NAME));
        const existed = await this.fileService.exist(configPath);
        
        // read the local user configuration
        if (existed && !defaultConfigOn) {
            await this.init(configPath);
        }
        
        // initially just a copy of the default one
        else if (!existed && defaultConfigOn) {
            await this.save(configPath);
        }
    }

    // [protected override method]

    /** @override */
    protected override __fireOnSpecificEvent(section: EUserSettings, change: any): void {
        switch (section) 
        {
            case EUserSettings.Markdown:
                this._onDidChangeMarkdownSettings.fire(change);
                break;
            case EUserSettings.NotebookGroup:
                this._onDidChangeNotebookManagerSettings.fire(change);
                break;
        }
    }

    // [private helper method]

    /**
     * @description Validates the structure of {@link NOTA_DIR_NAME} given
     * the path.
     * @param path The path to {@link NOTA_DIR_NAME}.
     * 
     * @throws An exception will be thrown if cannot create directory properly.
     */
    private async __validateLocalUserDirectory(path: string): Promise<void> {
        
        try {
            await this.fileService.createDir(URI.fromFile(path)); // .nota

            await this.fileService.createDir(URI.fromFile(resolve(path, 'log')));
            await this.fileService.createDir(URI.fromFile(resolve(path, 'ref')));    
        } catch (err) {
            throw err;
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
        @IFileService fileService: IFileService,
        @ILogService logService: ILogService,
    ) {
        super(IConfigType.GLOBAL, new DefaultGlobalConfigModel(), fileService, logService);
    }

    public override async init(path: URI): Promise<void> {
        path = __getGlobalConfigResourcePath(path);
        return await super.init(path);
    }

    /** @override */
    protected override __fireOnSpecificEvent(section: EGlobalSettings, change: any): void {
        switch (section) 
        {
            case EGlobalSettings.Application:
                this._onDidChangeApplicationSettings.fire(change);
                break;
            case EGlobalSettings.NotebookGroup:
                this._onDidChangeNotebookManagerSettings.fire(change);
                break;
        }
    }
}

/**
 * @readonly Returns a default URI of the global config file which is named 
 * 'nota.config.json' at the root directory of the application.
 */
function __getGlobalConfigResourcePath(configRootPath: URI): URI {
    return URI.fromFile(join(URI.toFsPath(configRootPath), GLOBAL_CONFIG_FILE_NAME));
}

/**
 * @readonly Returns a default URI of the global config file which is named 
 * 'user.config.json' at the root directory of the application.
 */
function __getUserConfigResourcePath(configRootPath: URI): URI {
    return URI.fromFile(join(URI.toFsPath(configRootPath), USER_CONFIG_FILE_NAME));
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
    NotebookGroup = 'notebookManager',

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
     * Used for file/directory reading and writing.
     */
    OpenDirConfig: Electron.OpenDialogOptions;

    /**
     * If enables keyboard screencast.
     */
     keyboardScreenCast: boolean;
}

/** @SettingInterface */
export interface IGlobalNotebookManagerSettings {

    /**
     * When true, NotebookGroup will read or create the default configuration in 
     * '<appRootPath>/.nota/user.config.json'.
     * 
     * When false, NotebookGroup will read or create a local configuration file 
     * in '<notebookManagerPath>/.nota/config.json'.
     */
    defaultConfigOn: boolean;

    /**
     * When the application started, determine whether to open the previous 
     * opened directory.
     */
    startPreviousNotebookManagerDir: boolean;
    
    /**
     * Stores the previous opened notebook manager directory path.
     */
    previousNotebookManagerDir: string;
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
                OpenDirConfig:  {
                    defaultPath: DESKTOP_ROOT_PATH,
                    buttonLabel: 'select a directory',
                    properties: [
                        /* 'openFile', */
                        'openDirectory'
                    ]
                } as Electron.OpenDialogOptions,
                keyboardScreenCast: false,
            } as IGlobalApplicationSettings,
            'notebookManager': 
            {
                defaultConfigOn: false,
                startPreviousNotebookManagerDir: true,
                previousNotebookManagerDir: '',
            } as IGlobalNotebookManagerSettings
        };
    }
}

/*******************************************************************************
 * @readonly User Configurations
 ******************************************************************************/

/** @SettingSection */
export const enum EUserSettings {
    
    /** {@link IUserNotebookManagerSettings} */
    NotebookGroup = 'notebookManager',

    /** {@link IUserMarkdownSettings} */
    Markdown = 'markdown',

}

/** @SettingInterface */
export interface IUserNotebookManagerSettings {

    /**
     * To excludes files, please use regular expression form.
     * @note This has lower priority than 'notebookManagerInclude'.
     */
    notebookManagerExclude: string[];
    
    /**
     * To includes files, please use regular expression form.
     * @note This has higher priority than 'notebookManagerExclude'.
     */
    notebookManagerInclude: string[];

    /**
     * The previous opened notebook (directory) name.
     */
    previousOpenedNotebook: string;
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
                notebookManagerExclude: [
                    '^\\..*',
                ] as string[],
                notebookManagerInclude: [

                ] as string[],
                previousOpenedNotebook: '',
            },
            'markdown':
            {
                fileAutoSaveOn: false,
                defaultMarkdownMode: 'wysiwyg' as MarkdownRenderMode,
            }
        };
    }

}