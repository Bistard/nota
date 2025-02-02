import { MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { PrimitiveType } from "src/base/common/utilities/type";
import { InspectorItemRenderer, InspectorItemProvider } from "src/code/browser/inspector/inspectorItemRenderer";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IHostService } from "src/platform/host/common/hostService";
import { InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";

export class InspectorTree extends MultiTree<InspectorItem, void> {

    public readonly rootItem: InspectorItem;

    constructor(
        container: HTMLElement,
        data: InspectorData[],
        configurationService: IConfigurationService,
        hostService: IHostService,
        getCurrentView: () => InspectorDataType | undefined,
    ) {
        const rootItem = new InspectorItem('$_root_', undefined, 'object');
        const initData = transformDataToTree(data);
        super(
            container,
            rootItem,
            [new InspectorItemRenderer(configurationService, hostService, getCurrentView)],
            new InspectorItemProvider(),
            {
                collapsedByDefault: false,
                transformOptimization: true,
                identityProvider: {
                    getID: configName => configName.key,
                },
            }
        );
        this.rootItem = rootItem;

        this.splice(this.rootItem, initData);
        this.layout();
    }
}

export class InspectorItem {
    constructor(
        public readonly key: string,
        public readonly value: PrimitiveType | undefined,
        public readonly id?: string,
        public readonly isColor?: true,
        public readonly isEditable?: true,
    ) {}
}

function transformDataToTree(data: InspectorData[]): ITreeNodeItem<InspectorItem>[] {
    function buildTree(data: InspectorData[]): ITreeNodeItem<InspectorItem>[] {
        return data.map(item => {
            const node: ITreeNodeItem<InspectorItem> = {
                data: new InspectorItem(item.key, item.value, item.id, item.isColor, item.isEditable),
                collapsible: !!item.children,
                collapsed: item.collapsedByDefault,
                children: item.children ? buildTree(item.children) : undefined,
            };
            return node;
        });
    }
    return buildTree(data);
}
