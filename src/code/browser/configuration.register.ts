import { ColorThemeType } from "src/workbench/services/theme/themeConfiguration";
import { IConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { LanguageType } from "src/platform/i18n/common/i18n";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";

export const enum WorkbenchConfiguration {
    DisplayLanguage = 'workbench.language',
    ColorTheme = 'workbench.colorTheme',
    KeyboardScreenCast = 'workbench.keyboardScreenCast',
}

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

Registrant.registerConfigurations({
    id: 'workbench',
    properties: {
        ['workbench']: {
            type: 'object',
            required: [],
            properties: {
                ['language']: {
                    type: 'string',
                    enum: [LanguageType.en, LanguageType["zh-cn"], LanguageType["zh-tw"]],
                    default: LanguageType.en,
                },
                ['colorTheme']: {
                    type: 'string',
                    enum: [ColorThemeType.Light, ColorThemeType.Dark],
                    default: ColorThemeType.Light,
                },
                ['keyboardScreenCast']: {
                    type: 'boolean',
                    default: true,
                }
            }
        },
    },
});
