import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { FileSortOrder, FileSortType } from "src/workbench/services/fileTree/fileTreeSorter";

export const enum SideViewConfiguration {
    DefaultSideView       = 'sideView.defaultView',

    ExplorerViewMode      = 'sideView.explorer.mode',
    ExplorerViewInclude   = 'sideView.explorer.include',
    ExplorerViewExclude   = 'sideView.explorer.exclude',

    ExplorerFileSortType  = 'sideView.explorer.fileSortType',
    ExplorerFileSortOrder = 'sideView.explorer.fileSortOrder',
}

export const rendererSideViewConfigurationRegister = createRegister(
    RegistrantType.Configuration, 
    'rendererSideView',
    (registrant) => {
        registrant.registerConfigurations({
            id: 'side-view',
            properties: {
                ['sideView']: {
                    type: 'object',
                    properties: {
                        
                        // sideView.defaultView
                        ['defaultView']: {
                            type: 'string',
                            default: 'explorer',
                        },
                        
                        // sideView.explorer
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
                                }
                            }
                        }
                    }
                },
            }
        });
    },
);
