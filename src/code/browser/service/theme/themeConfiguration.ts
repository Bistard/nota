import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";

// TODO
export const enum ColorThemeType {
    Light = 'light',
}

export const enum ThemeConfigSection {
    ColorTheme = 'workbench.colorTheme',
}

/**
 * @class A wrapper class over {@link IConfigService} that only obtains latest 
 * theme related configuration.
 */
export class ThemeConfiguration {

    constructor(private readonly configService: IConfigService) {}

    public getColorTheme(): string {
        return this.configService.get<string>(BuiltInConfigScope.User, ThemeConfigSection.ColorTheme);
    }
}