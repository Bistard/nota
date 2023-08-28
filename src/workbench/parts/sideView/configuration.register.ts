import { TreeMode } from "src/workbench/services/explorerTree/treeService";
import { IConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";

export const enum SideViewConfiguration {
    DefaultSideView = 'sideView.defaultView',

    ExplorerViewMode = 'sideView.explorer.mode',
    ExplorerViewInclude = 'sideView.explorer.include',
    ExplorerViewExclude = 'sideView.explorer.exclude',
}

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

Registrant.registerConfigurations({
    id: 'side-view',
    properties: {
        ['sideView']: {
            type: 'object',
            properties: {
                
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
                    }
                }
            }
        },
    }
});
