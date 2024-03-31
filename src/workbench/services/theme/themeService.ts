import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ColorThemeType, PresetColorTheme } from "src/workbench/services/theme/theme";
import { APP_DIR_NAME, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { URI } from "src/base/common/files/uri";
import { err, ok } from "src/base/common/result";
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IFileService } from "src/platform/files/common/fileService";
import { ILogService } from "src/base/common/logger";
import { InitProtector } from "src/base/common/error";
import { ColorTheme, IColorTheme, PRESET_COLOR_THEME_ARR, isPresetColorTheme } from "src/workbench/services/theme/colorTheme";
import { jsonSafeParse } from "src/base/common/json";
import { Dictionary, isObject, isString } from "src/base/common/utilities/type";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { assert, panic } from "src/base/common/utilities/panic";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";
import { mixin } from "src/base/common/utilities/object";
import { ColorMap } from "src/base/common/color";
import { noop } from "src/base/common/performance";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { ColorRegistrant } from "src/workbench/services/theme/colorRegistrant";

export const IThemeService = createService<IThemeService>('theme-service');

/**
 * An interface only for {@link ThemeService}.
 */
export interface IThemeService extends Disposable, IService {

    /**
     * The root path that stores all the theme files (JSON files).
     * @example .wisp/theme/
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
     * // REVIEW: out of update doc
     * @description Changes the current theme to the new theme with the given ID.
     * @param id If the id is an URI, the service will try to read the URI
     *           as a JSON file for theme data. If id is an string, it will be
     *           considered as the JSON file name to read at the {@link themeRootPath}.
     * 
     * @note This will fire {@link onDidChangeTheme} once successful.
     * @note When the AsyncResult is resolved as ok, means the new theme is 
     *       loaded successfully and returned. Otherwise an Error must 
     *       encountered.
     */
    switchTo(id: string): Promise<IColorTheme>;

    /**
     * @description Initializes the theme service. Set the current theme to 
     * either:
     *      1. the theme ID that is written in the configuration file, or
     *      2. preset one.
     * @note This will only be invoked when the application get started.
     */
    init(): Promise<void>;
}

/**
 * An interface only for {@link RawThemeJsonReadingData}
 * 
 * @description A valid theme .json file should have four keys: 1. Theme type 
 * 2. Name of the theme 3. theme description 4. colors used in the theme
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

    private readonly _registrant: ColorRegistrant;
    private readonly _initProtector: InitProtector;
    
    private readonly _presetThemes: Map<string, IColorTheme>;
    private _currentTheme?: IColorTheme;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IRegistrantService registrantService: IRegistrantService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IBrowserEnvironmentService environmentService: IBrowserEnvironmentService,
        @INotificationService private readonly notificationService: INotificationService,
    ) {
        super();
        this._initProtector = new InitProtector();
        this._presetThemes = new Map<string, IColorTheme>();
        this._currentTheme = undefined;
        this._registrant = registrantService.getRegistrant(RegistrantType.Color);

        this.themeRootPath = URI.join(environmentService.appRootPath, APP_DIR_NAME, 'theme');
    }

    // [public methods]

    public getCurrTheme(): IColorTheme {
        if (!this._currentTheme) {
            panic("[ThemeService] ThemeService has not been initialized!");
        }
        return this._currentTheme;
    }

    public async switchTo(id: string): Promise<IColorTheme> {
        
        // Read from the memory if it is identified as a preset theme.
        const presetTheme = this._presetThemes.get(id);
        if (presetTheme) {
            this.__applyColorTheme(presetTheme);
            return presetTheme;
        }

        // The ID is not identified, try to read it from the disk.
        const themePath = URI.join(this.themeRootPath, `${id}.json`);
        
        // read from the disk and try to parse it
        return this.fileService.readFile(themePath)
            .andThen(themeData => jsonSafeParse(themeData.toString())
            
            // validate the raw data and apply the theme
            .andThen<IColorTheme, Error>(rawData => {
                const validation = this.__isValidTheme(rawData, false);
                if (!validation.valid) {
                    return err(new Error(`Cannot validate the theme at: '${URI.toString(themePath)}'. The reason is: ${validation.reason}`));
                }
                
                const newTheme = new ColorTheme(validation.rawData);
                this.__applyColorTheme(newTheme);

                return ok(newTheme);
            }))
            .match(
                newTheme => newTheme,
                error => {
                    this.logService.error('themeService', `Cannot switch to the theme '${id}'. The reason is:`, error);
                    this.notificationService.notify({
                        message: `Failed to switch to theme '${id}'. Please check the theme settings and try again.`,
                        actions: [{
                            label: 'Dismiss',
                            run: noop,
                        }]
                    });

                    // If there's no current theme, use a preset theme.
                    if (!this._currentTheme) {
                        const presetTheme = this.__applyColorTheme(undefined);
                        return presetTheme;
                    }

                    return this._currentTheme;
                }
            );
    }
    
    public async init(): Promise<void> {
        this._initProtector.init('Cannot init twice').unwrap();
        this.__assertPresetThemes();
    
        const themeID = this.configurationService.get<string>(
            WorkbenchConfiguration.ColorTheme,
            PresetColorTheme.LightModern,
        );
        await this.switchTo(themeID);
    }
    
    // [private methods]
    
    /**
     * @description Assert and make sure all the preset themes are all valid 
     * {@link ColorTheme}s.
     */
    private __assertPresetThemes(): void {
        for (const themeName of PRESET_COLOR_THEME_ARR) {
            const rawColorMap = this._registrant.getRegisteredColorMap(themeName);  

            const validation = this.__isValidTheme(rawColorMap, true);
            if (!validation.valid) {
                panic(new Error(`[ThemeService] Preset color theme is not a valid theme: ${themeName}. The reason is: ${validation.reason}`));
            }

            const validMap = validation.rawData;
            this._presetThemes.set(validMap.name, new ColorTheme(validMap));
        }
    }

    private __isValidTheme(rawData: unknown, isPreset: boolean): ColorThemeValidateResult {
        if (!isObject(rawData)) {
            return { valid: false, reason: 'The theme raw data is not an object type.' };
        }
    
        // Basic validation for the structure of 'rawData'
        const basicValidation = isString(rawData['type']) &&
                                isString(rawData['name']) &&
                                isString(rawData['description']) &&
                                isObject(rawData['colors']);
        if (!basicValidation) {
            return { valid: false, reason: 'The theme is missing the basic metadata: "type", "name", "description" or "colors".' };
        }

        if (!isPreset && isPresetColorTheme(rawData['name'])) {
            return { valid: false, reason: `The theme shares its name with a preset theme: ${rawData['name']}.` };
        }

        /**
         * Ensure every required color location is present in the theme when it 
         * is a preset theme. The user theme is allow to have partial colors
         * since the missing one will be filled with the preset one.
         */
        if (isPreset) {
            const template = this._registrant.getTemplate();
            for (const location of template) {
                const isPresent = isString(rawData['colors'][location]);
                if (!isPresent) {
                    return { valid: false, reason: `The theme is missing the color: '${location}'` };
                }
            }
        }
        
        return { valid: true, rawData: <any>rawData };
    }

    /**
     * @description When `undefined` if provided, applying {@link PresetColorTheme.LightModern}
     * as default.
     */
    private __applyColorTheme(newTheme?: IColorTheme): IColorTheme {
        newTheme ??= assert(this._presetThemes.get(PresetColorTheme.LightModern));
        
        this.__updateDynamicCSSRules(newTheme);
        this._currentTheme = newTheme;

        this._onDidChangeTheme.fire(newTheme);
        return newTheme;
    }

    private __updateDynamicCSSRules(theme: IColorTheme): void {
        const resolvedColorMap = this.__mergeWithPresetColorMap(theme);
        const cssRules = new Set<string>();

        // Generate CSS variables for each color in the theme
        Object.entries(resolvedColorMap).forEach(([colorName, colorValue]) => {
            cssRules.add(`:root { --${colorName}: ${colorValue}; }`); // REVIEW
        });
        const cssString = Array.from(cssRules).join('\n');
        this.__applyRules(cssString, theme.name); 
    }

    /**
     * Consider the user provided {@link IColorTheme} might miss colors, to
     * make sure all the colors are present, we mixin the {@link ColorMap}
     * to the corresponding preset one.
     */
    private __mergeWithPresetColorMap(theme: IColorTheme): ColorMap {
        if (isPresetColorTheme(theme.name)) {
            return theme.getColorMap();
        } 
        
        const baseColorMap = theme.type === ColorThemeType.Light
            ? assert(this._presetThemes.get(PresetColorTheme.LightModern))
            : assert(this._presetThemes.get(PresetColorTheme.DarkModern));
        
        return mixin(baseColorMap, theme.getColorMap(), true);
    }

    private __applyRules(styleSheetContent: string, rulesClassName: string): void {
        const themeStyles = document.head.getElementsByClassName(rulesClassName);
    
        if (themeStyles.length === 0) {
            // If no existing <style> element for the theme, create a new one
            const elStyle = document.createElement('style');
            elStyle.className = rulesClassName;
            elStyle.textContent = styleSheetContent;
            document.head.appendChild(elStyle);
        } else {
            // If a <style> element already exists, update its content
            (themeStyles[0] as HTMLStyleElement).textContent = styleSheetContent;
        }
    }
}

type ColorThemeValidateResult = IOkColorThemeResult | IErrColorThemeResult;

interface IOkColorThemeResult {
    readonly valid: true;
    readonly rawData: IRawThemeJsonReadingData;
}

interface IErrColorThemeResult {
    readonly valid: false;
    readonly reason: string;
}