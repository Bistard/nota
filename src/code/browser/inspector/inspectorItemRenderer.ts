import { getIconClass } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { IListItemProvider } from "src/base/browser/secondary/listView/listItemProvider";
import { IListViewMetadata, RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { ITreeNode } from "src/base/browser/secondary/tree/tree";
import { ITreeListRenderer } from "src/base/browser/secondary/tree/treeListRenderer";
import { Color } from "src/base/common/color";
import { FuzzyScore } from "src/base/common/fuzzy";
import { isBoolean, isNullable, isNumber, isString } from "src/base/common/utilities/type";
import { InspectorItem } from "src/code/browser/inspector/inspectorTree";
import { IConfigurationService, ConfigurationModuleType } from "src/platform/configuration/common/configuration";
import { IEncryptionService } from "src/platform/encryption/common/encryptionService";
import { IHostService } from "src/platform/host/common/hostService";
import { InspectorDataType } from "src/platform/inspector/common/inspector";
import { StatusKey } from "src/platform/status/common/status";

interface IInspectorItemMetadata extends IListViewMetadata {
    readonly keyElement: HTMLElement;
    readonly valueElement: HTMLInputElement;
}
const InspectorRendererType = 'inspector-renderer';

export class InspectorItemRenderer implements ITreeListRenderer<InspectorItem, FuzzyScore, IInspectorItemMetadata> {

    public readonly type: RendererType = InspectorRendererType;

    constructor(
        private readonly getCurrentView: () => InspectorDataType | undefined,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IHostService private readonly hostService: IHostService,
        @IEncryptionService private readonly encryptionService: IEncryptionService,
    ) {}

    public render(element: HTMLElement): IInspectorItemMetadata {
        // key part
        const key = document.createElement('span');
        key.className = 'inspector-item-key';
        key.style.lineHeight = `${InspectorItemProvider.Size - 4}px`;
        element.appendChild(key);

        // value part
        const value = document.createElement('input');
        value.className = 'inspector-item-value';
        value.style.lineHeight = `${InspectorItemProvider.Size - 4}px`;
        element.appendChild(value);

        return {
            container: element,
            keyElement: key,
            valueElement: value,
        };
    }

    public update(item: ITreeNode<InspectorItem, void>, index: number, metadata: IInspectorItemMetadata, size?: number): void {
        const { data } = item;
        metadata.container.parentElement?.parentElement?.classList.toggle('top-level', item.depth === 1);
        
        const keyPart = metadata.keyElement;
        keyPart.textContent = data.key;
        const valuePart = metadata.valueElement;
        let textContent = data.value === undefined ? '' : String(data.value);

        if (data.value === undefined) {
            valuePart.disabled = true;
            valuePart.classList.add('disabled');
        } 
        else if (!data.isEditable) {
            valuePart.readOnly = true;
            valuePart.classList.add('disabled');
        }
        // editable
        else {
            valuePart.addEventListener('change', async e => {
                const raw = valuePart.value;
                const rawLower = raw.toLowerCase();
                let value: any;
                // string
                if (raw.startsWith('"') && raw.endsWith('"')) {
                    value = raw.slice(1, -1);
                }
                // boolean
                else if (rawLower === 'true' || rawLower === 'false') {
                    value = rawLower === 'true';
                }
                // number
                else if (isNaN(parseInt(raw)) === false) {
                    value = parseInt(raw);
                }
                // null
                else if (raw === 'null') {
                    value = null;
                }
                // array
                else if (raw.startsWith('[') && raw.endsWith(']')) {
                    value = JSON.parse(raw);
                }
                // unexpected
                else {
                    value = raw;
                }
                
                const currView = this.getCurrentView();
                if (currView === InspectorDataType.Status) {
                    // special handling: write these values as encrypted
                    if (data.id === StatusKey.textAPIKey) {
                        value = await this.encryptionService.encrypt(value);
                    }
                    this.hostService.setApplicationStatus(data.id as StatusKey, value);
                } else if (currView === InspectorDataType.Configuration) {
                    this.configurationService.set(data.id!, value, { type: ConfigurationModuleType.User });
                }
                
                e.stopPropagation();
            });
        }

        // color data
        if (data.isColor) {
            textContent = textContent.toUpperCase();
            valuePart.style.backgroundColor = `${textContent}`;
            valuePart.style.color = Color.parseHex(textContent).isDarker() ? 'white' : 'black'; // create contrast text color
        }
        // general case
        else if (isNumber(data.value)) {
            valuePart.style.color = `#a1f7b5`; // light green
        }
        else if (isString(data.value)) {
            valuePart.style.color = '#f28b54';
            textContent = `"${textContent}"`; // orange
        }
        else if (isBoolean(data.value) || isNullable(data.value)) {
            valuePart.style.color = '#9980ff'; // purple
        }
        else if (Array.isArray(data.value)) {
            textContent = `[${textContent}]`; // array
        }

        valuePart.defaultValue = textContent;
    }

    public updateIndent(item: ITreeNode<InspectorItem, FuzzyScore>, indentElement: HTMLElement): void {
        if (item.collapsible) {
            indentElement.classList.add(...getIconClass(Icons.ArrowRight));
        } else {
            indentElement.classList.remove(...getIconClass(Icons.ArrowRight));
        }
    }

    public dispose(data: IInspectorItemMetadata): void {
        // Dispose logic can be added here if necessary
    }
}

export class InspectorItemProvider implements IListItemProvider<InspectorItem> {

    /**
     * The height in pixels for every outline item.
     */
    public static readonly Size = 24;

    public getSize(data: InspectorItem): number {
        return InspectorItemProvider.Size;
    }

    public getType(data: InspectorItem): RendererType {
        return InspectorRendererType;
    }
}
