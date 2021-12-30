import { DESKTOP_ROOT_PATH } from "src/base/electron/app";
import { MarkdownRenderMode } from "src/code/browser/workbench/editor/markdown/markdown";
import { AppMode } from "src/code/common/service/configService/globalConfigService";

export enum IConfigType {
    USER,
    GLOBAL,
    TEST,
}

export interface IConfigChangeEvent {

    readonly type: IConfigType;
    readonly changes: IConfigChange;

}

export interface IConfigChange {
    keys: string[],
}

export interface IConfigModel {

    object: any;

    get<T>(section: string | undefined): T | undefined;
    set(section: string | undefined, value: any): void;

}

export class ConfigModel implements IConfigModel {

    constructor(
        private _object: any = {}
    ) {}

    get object(): any {
        return this._object;
    }

    protected __setObject(obj: any): void {
        this._object = obj;
    }

    public get<T>(section: string | undefined = undefined): T | undefined {
        if (section) {
            return this.__getConfigBySection<T>(section, this._object);
        } else {
            return <T>this._object;
        }
    }

    public set(section: string | undefined, value: any): void {
        if (section) {
            return this.__setConfigBySection(section, this._object, value);
        } else {
            this._object = value;
        }
    }

    private __getConfigBySection<T>(section: string, config: any): T | undefined {

        const sections = section.split('.');
        
        let currentSection = config;
        for (const sec of sections) {
            try {
                currentSection = currentSection[sec];
            } catch (err) {
                return undefined;
            }
        }

        return currentSection;
    }

    private __setConfigBySection(section: string, config: any, value: any): void {

        const sections = section.split('.');
        const lastSection = sections.pop()!;

        let currentSection = config;
        for (const subSection of sections) {
            currentSection = currentSection[subSection];
        }

        currentSection[lastSection] = value;
    }
}

/*******************************************************************************
 * Global Configurations
 ******************************************************************************/

/** @SettingSection */
export enum EGlobalSettings {
    
    Markdown = 'markdown',

}

/** @SettingInterface */
export interface IGlobalMarkdownSettings {

    /**
     * The application mode.
     */
    appMode: AppMode;
    
    /**
     * A boolean to determine whether opened the previous opened notebook manager directory.
     */
    startPreviousNoteBookManagerDir: boolean;
    
    /**
     * Stores the previous opened notebook manager directory path.
     */
    previousNoteBookManagerDir: string;
    
    /**
     * When true, NoteBookManager will read or create the default configuration in 
     * '<appRootPath>/config.json'.
     * 
     * When false, NoteBookManager will read or create a local configuration file 
     * in '<notebookManagerPath>/.mdnote/config.json'.
     */
    defaultConfigOn: boolean;

}

export class DefaultGlobalConfigModel extends ConfigModel {
    
    constructor() {
        super();
        this.__setObject(this.createDefault());
    }

    private createDefault(): any {
        return {
            'markdown': 
            {
                appMode: 'debug' as AppMode,
                startPreviousNoteBookManagerDir: true,
                previousNoteBookManagerDir: '',
                defaultConfigOn: false
            }
        };
    }

}

/*******************************************************************************
 * User Configurations
 ******************************************************************************/

/** @SettingSection */
export enum EUserSettings {
    
    Notebook = 'notebook',

}

/** @SettingInterface */
export interface UserNotebookSettings {

    /**
     * Used for file/directory reading and writing.
     */
    OpenDirConfig: Electron.OpenDialogOptions;
    
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
    
    /** auto file save option */
    fileAutoSaveOn: boolean;
    
    /** the default markdown render mode every time when the applicaiton starts */
    defaultMarkdownMode: MarkdownRenderMode;

    /** @deprecated */
    /** markdown spell check option (binds to specific notebook) */
    markdownSpellCheckOn: boolean;
    
}

export class DefaultUserConfigModel extends ConfigModel {

    constructor() {
        super();
        this.__setObject(this.createDefault());
        
    }

    private createDefault(): any {
        return {
            "notebook": 
            {
                OpenDirConfig:  {
                    defaultPath: DESKTOP_ROOT_PATH,
                    buttonLabel: "select a directory",
                    properties: [
                        /* "openFile", */
                        "openDirectory"
                    ]
                } as Electron.OpenDialogOptions,
                noteBookManagerExclude: [
                    ".*",
                ],
                noteBookManagerInclude: [

                ],
                fileAutoSaveOn: true,
                defaultMarkdownMode: 'wysiwyg' as MarkdownRenderMode,
                markdownSpellCheckOn: false,
            },
            // more and more...
        };
    }

}