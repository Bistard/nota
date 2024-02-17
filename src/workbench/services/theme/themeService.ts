import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ColorThemeType, PresetColorTheme } from "src/workbench/services/theme/theme";
import { APP_DIR_NAME, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { URI } from "src/base/common/files/uri";
import { AsyncResult, Err, Ok, panic } from "src/base/common/result";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { InitProtector } from "src/base/common/error";
import { WorkbenchConfiguration } from "src/code/browser/configuration.register";
import { ColorTheme, IColorTheme } from "src/workbench/services/theme/colorTheme";
import { jsonSafeParse } from "src/base/common/json";
import { Dictionary } from "src/base/common/utilities/type";

export const IThemeService = createService<IThemeService>('theme-service');

/**
 * An interface only for {@link ThemeService}.
 */
export interface IThemeService extends IService {

    /**
     * The root path that stores all the theme files (JSON files).
     */
    readonly themeRootPath: URI;

    /**
     * Fires the latest {@link IColorTheme} whenever the theme is changed.
     */
    readonly onDidChangeTheme: Register<IColorTheme>;

    /**
     * @description Get the current color theme ({@link IColorTheme}).
     */
    getCurrTheme(): IColorTheme;

    /**
     * @description Changes the current theme to the new one.
     * @param id If the id is an URI, the service will try to read the URI
     *           as a JSON file for theme data. If id is an string, it will be
     *           considered as the JSON file name to read at the {@link themeRootPath}.
     * 
     * @note This will fire {@link onDidChangeTheme} once successful.
     * @note When the AsyncResult is resolved as ok, means the new theme is 
     *       loaded successfully and returned. Otherwise an Error must 
     *       encountered.
     */
    changeCurrThemeTo(id: string): AsyncResult<IColorTheme, Error>;

    /**
     * @description Initializes the theme service. Set the current theme to 
     * either:
     *      1. the theme ID that is written in the configuration file, or
     *      2. preset one.
     * @note This will only be invoked when the application get started.
     */
    init(): AsyncResult<void, Error>;
}

/**
 * An interface only for {@link RawThemeJsonReadingData}
 */
export interface IRawThemeJsonReadingData {
    readonly type: ColorThemeType;
    readonly name: string;
    readonly description: string;
    readonly colors: Dictionary<string, string>;
}

/**
 * @class
 */
export class ThemeService extends Disposable implements IThemeService {

    declare _serviceMarker: undefined;

    // [events]
    

    private readonly _onDidChangeTheme = this.__register(new Emitter<IColorTheme>());
    public readonly onDidChangeTheme = this._onDidChangeTheme.registerListener;

    // [field]

    public readonly themeRootPath: URI;

    private readonly _initProtector: InitProtector;
    private readonly _presetThemes: IColorTheme[];
    private currentTheme: IColorTheme;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        super();
        this._initProtector = new InitProtector();
        this._presetThemes = this.initializePresetThemes();
        this.currentTheme = undefined!;

        // const registrant: any;
        // registrant.getAllRegisteredColors();

        this.themeRootPath = URI.join(environmentService.appRootPath, APP_DIR_NAME, 'theme');
    }

    // [public methods]

    public getCurrTheme(): IColorTheme {
        if (!this._initProtector.isInit) {
            panic("Theme has not been initialized!");
        }
        return this.currentTheme;
    }
    
    public changeCurrThemeTo(id: string): AsyncResult<IColorTheme, Error> {
        const themeUri = URI.join(this.themeRootPath, `${id}.json`);
    
        return this.fileService.readFile(themeUri)
            .andThen((themeData) => {
                const themeObj = jsonSafeParse(themeData.toString()).unwrap();
                if (this.isValidTheme(themeObj)) {
                    const newTheme = new ColorTheme(
                        themeObj.type,
                        themeObj.name,
                        themeObj.description,
                        themeObj.colors
                    );
                    this.currentTheme = newTheme;
                    this._onDidChangeTheme.fire(newTheme);
                    return AsyncResult.ok(newTheme);
                }
                return AsyncResult.err(new Error("Invalid theme object"));
            });
    }
    
    
    public init(): AsyncResult<void, Error> {
        this._initProtector.init('Cannot init twice').unwrap();
    
        // Initialize every preset color themes in the beginning since they are only present in memory.
        this.initializePresetThemes();
    
        const themeID = this.configurationService.get<string>(
            WorkbenchConfiguration.ColorTheme, // User settings
            PresetColorTheme.LightModern,      // Default
        );
    
        // Read the color theme from the disk by `themeID` under `this.themeRootPath`
        return this.changeCurrThemeTo(themeID)
            .andThen((theme) => {
                // Check if the loaded theme is missing any essential colors
                // TODO: don't need this, change later
                if (!this.isValidTheme(theme)) {
                    return AsyncResult.err(new Error("Theme missing essential colors."));
                }
                return AsyncResult.ok();
            });
            
    }

    // [private methods]

    private initializePresetThemes(): IColorTheme[] {
        const lightTheme: IColorTheme = new ColorTheme(ColorThemeType.Light, 'lightModern', undefined, {/* color mappings */});
        const darkTheme: IColorTheme = new ColorTheme(ColorThemeType.Dark, 'DarkModern', undefined, {/* color mappings */});
        return [lightTheme, darkTheme];
    }

    private isValidTheme(rawData: unknown): rawData is IRawThemeJsonReadingData {
        // TODO: check if the theme object has all the essential colors defined
        return true;     
    }
}
