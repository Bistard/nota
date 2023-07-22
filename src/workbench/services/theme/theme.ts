import { RGBA } from "src/base/common/color";
import { Disposable } from "src/base/common/dispose";
import { ColorThemeType } from "src/workbench/services/theme/themeConfiguration";
import { IThemeService } from "src/workbench/services/theme/themeService";

export interface IColorTheme {
    /**
     * The name of the theme.
     */
    readonly name: ColorThemeType;

    getColor(id: string, useDefault?: boolean): RGBA;
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
        this._theme = this.themeService.getTheme();
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

