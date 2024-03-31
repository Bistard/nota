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
 * // TODO
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

