import { Color } from "src/base/common/color";
import { Disposable } from "src/base/common/dispose";
import { IThemeService } from "src/code/browser/service/theme/themeService";

export const enum ThemeType {
    Classic = 'Classic',
}

export interface ITheme {
    /**
     * The name of the theme.
     */
    readonly name: ThemeType;

    getColor(id: string, useDefault?: boolean): Color;
}

/**
 * // TODO
 */
export abstract class Themable extends Disposable {

    private _theme: ITheme;
    protected readonly themeService: IThemeService;

    constructor(themeService: IThemeService) {
        super();
        this.themeService = themeService;
        this._theme = this.themeService.getTheme();
        this.__register(themeService.onDidChangeTheme(newTheme => this.onThemeChange(newTheme)));
    }

    protected get theme() {
        return this._theme;
    }

    protected onThemeChange(newTheme: ITheme): void {
        this._theme = newTheme;
        this.updateStyles();
    }

    protected abstract updateStyles(): void;
}

