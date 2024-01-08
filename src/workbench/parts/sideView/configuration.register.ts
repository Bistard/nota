import { TreeMode } from "src/workbench/services/explorerTree/treeService";
import { RegistrantType, createRegister } from "src/platform/registrant/common/registrant";
import { FileSortType } from "src/workbench/services/fileTree/fileTreeSorter";

export const enum SideViewConfiguration {
    DefaultSideView = 'sideView.defaultView',

    ExplorerViewMode = 'sideView.explorer.mode',
    ExplorerViewInclude = 'sideView.explorer.include',
    ExplorerViewExclude = 'sideView.explorer.exclude',

    ExplorerFileSorting = 'sideView.explorer.fileSorting',
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
                                ['mode']: {
                                    type: 'string',
                                    default: TreeMode.Classic,
                                },
                                ['include']: {
                                    type: 'array',
                                    default: ['^\\..*'],
                                },
                                ['exclude']: {
                                    type: 'array',
                                    default: [''],
                                },
                                ['fileSorting']: {
                                    type: 'string',
                                    enum: [FileSortType.CreationTimeAscending, 
                                        FileSortType.CreationTimeDescending, 
                                        FileSortType.CustomSort, 
                                        FileSortType.DefaultSystemSort, 
                                        FileSortType.ModificationTimeAscending, 
                                        FileSortType.ModificationTimeDescending, 
                                        FileSortType.NameAscending, 
                                        FileSortType.NameDescending],
                                    default: FileSortType.DefaultSystemSort,
                                },
                            }
                        }
                    }
                },
            }
        });
    },
);
