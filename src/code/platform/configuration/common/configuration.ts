import { app } from "electron";
import { MarkdownRenderMode } from "src/code/browser/workbench/workspace/markdown/markdown";
import { __ConfigModel } from "src/code/platform/configuration/common/configModel";
import { AppMode } from "src/code/platform/configuration/electron/configService";
import { Language } from "src/code/platform/i18n/i18n";

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

export class DefaultGlobalConfigModel extends __ConfigModel {
    
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
                    defaultPath: app.getPath('desktop'),
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

export class DefaultUserConfigModel extends __ConfigModel {

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