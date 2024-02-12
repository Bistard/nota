import { RGBA } from "src/base/common/color";
import { Disposable } from "src/base/common/dispose";
import { IThemeService } from "src/workbench/services/theme/themeService";

/**
 * The type of the theme. This is useful to categorize themes.
 */
export const enum ColorThemeType {
    Light = 'light',
    Dark = 'dark',
}

/**
 * A {@link IColorTheme} is a data structure that is consructed from a valid
 * JSON file. It contains color data for every UI components.
 */
export interface IColorTheme {
    
    /**
     * The type of the theme. This is useful to categorize themes.
     */
    readonly type: ColorThemeType;

    /**
     * The name of the theme.
     */
    readonly name: string;

    /**
     * The description of the theme. No descriptions if not provided.
     */
    readonly description?: string;

    /**
	 * @description Resolves the color of the given color identifier. 
	 * @param id the id of the color.
	 */
    getColor(id: string): RGBA;
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

