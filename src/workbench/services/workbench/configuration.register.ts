import { LanguageType } from "src/platform/i18n/common/i18n";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { IncrementFileType } from "src/workbench/services/fileTree/fileCommands";
import { FileSortOrder, FileSortType } from "src/workbench/services/fileTree/fileTreeSorter";
import { PresetColorTheme } from "src/workbench/services/theme/theme";

export const enum WorkbenchConfiguration {

    // [workbench]

    DisplayLanguage = 'workbench.language',
    ColorTheme = 'workbench.colorTheme',
    KeyboardScreenCast = 'workbench.keyboardScreenCast',

    // [sideView]
    
    DefaultSideView             = 'sideView.defaultView',
    ExplorerViewMode            = 'sideView.explorer.mode',
    ExplorerViewInclude         = 'sideView.explorer.include',
    ExplorerViewExclude         = 'sideView.explorer.exclude',
    ExplorerFileSortType        = 'sideView.explorer.fileSortType',
    ExplorerFileSortOrder       = 'sideView.explorer.fileSortOrder',
    ExplorerConfirmDragAndDrop  = 'sideView.explorer.confirmDragAndDrop',
    ExplorerIncrementFileNaming = 'sideView.explorer.incrementFileNaming',
}

/**
 * {@link rendererWorkbenchConfigurationRegister}
 * {@link rendererSideViewConfigurationRegister}
 */

export const rendererWorkbenchConfigurationRegister = createRegister(
    RegistrantType.Configuration,
    'rendererWorkbench',
    (registrant) => {
        registrant.registerConfigurations({
            id: 'workbench',
            properties: {

                // workbench configurations
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

export const rendererSideViewConfigurationRegister = createRegister(
    RegistrantType.Configuration,
    'rendererWorkbench',
    (registrant) => {
        registrant.registerConfigurations({
            id: 'sideView',
            properties: {

                // sideView configurations
                ['sideView']: {
                    type: 'object',
                    properties: {
                        ['defaultView']: {
                            type: 'string',
                            default: 'explorer',
                        },
                        ['explorer']: {
                            type: 'object',
                            properties: {
                                ['include']: {
                                    type: 'array',
                                    default: ['^\\..*'],
                                },
                                ['exclude']: {
                                    type: 'array',
                                    default: [''],
                                },
                                ['fileSortType']: {
                                    type: 'string',
                                    enum: [
                                        FileSortType.Default,
                                        FileSortType.ModificationTime,
                                        FileSortType.Alphabet,
                                        FileSortType.CreationTime,
                                        FileSortType.Custom,
                                    ],
                                    default: FileSortType.Default,
                                },
                                ['fileSortOrder']: {
                                    type: 'string',
                                    enum: [
                                        FileSortOrder.Ascending,
                                        FileSortOrder.Descending,
                                    ],
                                    default: FileSortOrder.Ascending,
                                },
                                ['confirmDragAndDrop']: {
                                    type: 'boolean',
                                    default: true,
                                },
                                ['incrementFileNaming']: {
                                    type: 'string',
                                    default: IncrementFileType.Simple,
                                    enum: [IncrementFileType.Simple, IncrementFileType.Smart],
                                }
                            }
                        }
                    }
                },
            },
        });
    },
);
