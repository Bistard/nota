import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IColorTheme } from "src/code/browser/service/theme/theme";
import { ThemeConfiguration } from "src/code/browser/service/theme/themeConfiguration";
import { IConfigurationService } from "src/code/platform/configuration/common/configuration";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";

export const IThemeService = createService<IThemeService>('theme-service');

export interface IThemeService extends IMicroService {
    
    readonly onDidChangeTheme: Register<IColorTheme>;
    
    getTheme(): IColorTheme;
}

export class ThemeService extends Disposable implements IThemeService {

    _microserviceIdentifier: undefined;

    // [event]

    private readonly _onDidChangeTheme = this.__register(new Emitter<IColorTheme>());
    public readonly onDidChangeTheme = this._onDidChangeTheme.registerListener;

    // [field]

    private _currTheme!: IColorTheme;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super();

        // TODO: read configuration about theme
        const themeConfiguraion = new ThemeConfiguration(configurationService);

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
