import { TreeMode } from "src/code/browser/service/explorerTree/treeService";
import { IConfigurationRegistrant } from "src/code/platform/configuration/common/configurationRegistrant";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

export const enum SideViewConfiguration {
    DefaultSideView = 'sideView.defaultView',

    ExplorerViewMode = 'explorer.mode',
    ExplorerViewInclude = 'explorer.include',
    ExplorerViewExclude = 'explorer.exclude',
}

const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

Registrant.registerConfigurations({
    id: 'side-view',
    properties: {
        [SideViewConfiguration.DefaultSideView]: {
            type: 'string',
            default: 'explorer',
        },
    }
});

Registrant.registerConfigurations({
    id: 'explorer-view',
    properties: {
        [SideViewConfiguration.ExplorerViewMode]: {
            type: 'string',
            default: TreeMode.Classic,
        },
        [SideViewConfiguration.ExplorerViewInclude]: {
            type: 'array',
            default: ['^\\..*'],
        },
        [SideViewConfiguration.ExplorerViewExclude]: {
            type: 'array',
            default: [''],
        },
    }
});
