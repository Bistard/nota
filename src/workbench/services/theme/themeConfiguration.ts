import { IConfigurationService } from "src/platform/configuration/common/configuration";

// TODO
export const enum ColorThemeType {
    Light = 'light',
    Dark = 'dark',
}

export const enum ThemeConfigSection {
    ColorTheme = 'workbench.colorTheme',
}

/**
 * @class A wrapper class over {@link IConfigService} that only obtains latest 
 * theme related configuration.
 */
export class ThemeConfiguration {

    constructor(private readonly configurationService: IConfigurationService) { }

    // public getColorTheme(): string {
    //     return this.configurationService.get<string>(BuiltInConfigScope.User, ThemeConfigSection.ColorTheme);
    // }
}