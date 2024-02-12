import { LanguageType } from "src/platform/i18n/common/i18n";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { PresetColorTheme } from "src/workbench/services/theme/theme";

export const enum WorkbenchConfiguration {
    DisplayLanguage = 'workbench.language',
    ColorTheme = 'workbench.colorTheme',
    KeyboardScreenCast = 'workbench.keyboardScreenCast',
}

export const rendererWorkbenchConfigurationRegister = createRegister(
    RegistrantType.Configuration, 
    'rendererWorkbench',
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
                            default: PresetColorTheme.LightModern,
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
