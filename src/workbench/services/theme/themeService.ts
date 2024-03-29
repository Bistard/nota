import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { IColorTheme } from "src/workbench/services/theme/theme";
import { ThemeConfiguration } from "src/workbench/services/theme/themeConfiguration";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IThemeService = createService<IThemeService>('theme-service');

export interface IThemeService extends IService {

    readonly onDidChangeTheme: Register<IColorTheme>;

    getTheme(): IColorTheme;
}

export class ThemeService extends Disposable implements IThemeService {

    declare _serviceMarker: undefined;

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
