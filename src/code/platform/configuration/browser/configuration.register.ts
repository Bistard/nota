import { ColorThemeType } from "src/code/browser/service/theme/themeConfiguration";
import { IConfigurationRegistrant } from "src/code/platform/configuration/common/configurationRegistrant";
import { LanguageType } from "src/code/platform/i18n/common/i18n";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

export const enum WorkbenchConfiguration {
    TextLanguage = 'workbench.language',
    ColorTheme = 'workbench.colorTheme',
    KeyboardScreenCast = 'workbench.keyboardScreenCast',
}

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

Registrant.registerConfigurations({
    id: 'workbench',
    properties: {
        [WorkbenchConfiguration.TextLanguage]: {
            type: 'string',
            enum: [LanguageType.en, LanguageType["zh-cn"], LanguageType["zh-tw"]],
            default: LanguageType.en,
        },
        [WorkbenchConfiguration.ColorTheme]: {
            type: 'string',
            enum: [ColorThemeType.Light, ColorThemeType.Dark],
            default: ColorThemeType.Light,
        },
        [WorkbenchConfiguration.KeyboardScreenCast]: {
            type: 'boolean',
            default: false,
        },
    },
});