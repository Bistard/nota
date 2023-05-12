import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IColorTheme } from "src/code/browser/service/theme/theme";
import { ThemeConfiguration } from "src/code/browser/service/theme/themeConfiguration";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IThemeService = createService<IThemeService>('theme-service');

export interface IThemeService {
    
    readonly onDidChangeTheme: Register<IColorTheme>;
    
    getTheme(): IColorTheme;
}

export class ThemeService extends Disposable implements IThemeService {

    // [event]

    private readonly _onDidChangeTheme = this.__register(new Emitter<IColorTheme>());
    public readonly onDidChangeTheme = this._onDidChangeTheme.registerListener;

    // [field]

    private _currTheme!: IColorTheme;

    // [constructor]

    constructor(
        @IConfigService private readonly configService: IConfigService,
    ) {
        super();

        // TODO: read configuration about theme
        const themeConfig = new ThemeConfiguration(configService);

        // TODO: get theme data based on the configuration


        // TODO: update dynamic CSS rules based on colorRegistrant

        // TODO: update theme based on theme data

        // TODO: on did theme change
    }

    // [public methods]

    public getTheme(): IColorTheme {
        return this._currTheme;
    }

}
