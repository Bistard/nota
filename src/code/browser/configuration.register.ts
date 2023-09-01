import { ColorThemeType } from "src/workbench/services/theme/themeConfiguration";
import { LanguageType } from "src/platform/i18n/common/i18n";
import { RegistrantService } from "src/platform/registrant/common/registrantService";
import { RegistrantType } from "src/platform/registrant/common/registrant";

export const enum WorkbenchConfiguration {
    DisplayLanguage = 'workbench.language',
    ColorTheme = 'workbench.colorTheme',
    KeyboardScreenCast = 'workbench.keyboardScreenCast',
}

export const rendererWorkbenchConfigurationRegister = RegistrantService.createRegister(
    RegistrantType.Configuration, 
    'rendererWorkbenchConfiguration',
    (registrant) => {
        registrant.registerConfigurations({
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
    },
);
