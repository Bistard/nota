import { Disposable } from "src/base/common/dispose";
import { IColorTheme } from "src/workbench/services/theme/colorTheme";
import { IThemeService } from "src/workbench/services/theme/themeService";

/**
 * The type of the theme. This is useful to categorize themes.
 */
export const enum ColorThemeType {
    Light = 'light',
    Dark = 'dark',
}

/**
 * A list of preset themes.
 */
export const enum PresetColorTheme {
    LightModern = 'LightModern',
    DarkModern = 'DarkModern',
}

/**
 * @class Provides a base class for components that are theme-aware within an 
 * application.
 * 
 * It integrates with a theme service to automatically update its theme-related 
 * properties and styles whenever the application's theme changes.
 *
 * This abstract class requires the implementation of the `__updateStyles` 
 * method to specify how the component should update its styles in response to 
 * theme changes.
 */
export abstract class Themable extends Disposable {

    private _theme: IColorTheme;
    protected readonly themeService: IThemeService;

    constructor(themeService: IThemeService) {
        super();
        this.themeService = themeService;
        this._theme = this.themeService.getCurrTheme();
        this.__register(themeService.onDidChangeTheme(newTheme => this.__onThemeChange(newTheme)));
    }

    protected get theme() {
        return this._theme;
    }

    protected __onThemeChange(newTheme: IColorTheme): void {
        this._theme = newTheme;
        this.__updateStyles();
    }

    protected abstract __updateStyles(): void;
}

