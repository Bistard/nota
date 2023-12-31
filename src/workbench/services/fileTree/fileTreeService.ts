import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree as IFileTree } from "src/workbench/services/fileTree/fileTree";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider, FileItem as FileItem, defaultFileItemCompareFn } from "src/workbench/services/fileTree/fileItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { FileItemProvider as FileItemProvider, FileItemRenderer as FileItemRenderer } from "src/workbench/services/fileTree/fileItemRenderer";
import { FileItemDragAndDropProvider } from "src/workbench/services/fileTree/fileItemDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { FileItemFilter as FileItemFilter } from "src/workbench/services/fileTree/fileItemFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";
import * as fs from 'fs';
import * as path from 'path';
import { IBrowserEnvironmentService, IDiskEnvironmentService, IEnvironmentService } from "src/platform/environment/common/environment";

export interface IFileTreeService extends ITreeService<FileItem> {
    // noop
}

/**
 * // TODO
 */
export class FileTreeService extends Disposable implements IFileTreeService {

    declare _serviceMarker: undefined;

    // [field]

    private _tree?: IFileTree<FileItem, void>;
    private customSortOrderMap: Map<string, string[]> = new Map();

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IBrowserEnvironmentService private readonly environmentService:IBrowserEnvironmentService
    ) {
        super();
    }

    // [event]

    get onSelect(): Register<IFileTreeOpenEvent<FileItem>> {
        return this._tree!.onSelect;
    }

    // [getter]

    get container(): HTMLElement | undefined {
        return (this._tree ? this._tree.DOMElement : undefined);
    }

    get root(): URI | undefined {
        return (this._tree ? this._tree.root.uri : undefined);
    }

    get isOpened(): boolean {
        return !!this._tree;
    }

    // [public mehtods]

    public async init(container: HTMLElement, root: URI): Promise<void> {
        
        // retrieve configurations
        const filterOpts: IFilterOpts = {
            exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
            include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
        };
        const ifSupportFileSorting = this.configurationService.get<boolean>(SideViewConfiguration.ExplorerFileSorting, false);

        this.loadCustomSortOrder(root.toString());
        const customSorter = new CustomFileTreeSorter(this.customSortOrderMap.get(root.toString()) || []);
        // const customSorter = new CustomFileTreeSorter(this.customSortOrder);
        const compareFunction = ifSupportFileSorting ? customSorter.compare : defaultFileItemCompareFn;
        
        // resolve the root of the directory first
        const rootStat = await this.fileService.stat(root, { resolveChildren: true });
        const rootItem = new FileItem(rootStat, null, filterOpts);

        // construct the file system hierarchy
        const dndProvider = new FileItemDragAndDropProvider(this.fileService);
        this._tree = this.__register(
            new FileTree<FileItem, FuzzyScore>(
                container,
                rootItem,
                {
                    itemProvider: new FileItemProvider(),
                    renderers: [new FileItemRenderer()],
                    childrenProvider: new FileItemChildrenProvider(this.logService, this.fileService, filterOpts, compareFunction),
                    identityProvider: { getID: (data: FileItem) => URI.toString(data.uri) },

                    // optional
                    collapsedByDefault: true,
                    filter: new FileItemFilter(),
                    dnd: dndProvider,
                },
            )
        );
        dndProvider.bindWithTree(this._tree);

        await this._tree.refresh();
    }

    public layout(height?: number | undefined): void {
        this._tree?.layout(height);
    }

    public async refresh(data?: FileItem): Promise<void> {
        this._tree?.refresh(data);
    }

    public async close(): Promise<void> {
        // TODO
    }

    private loadCustomSortOrder(folderUri: string): void {
        const folderName = path.basename(folderUri);
        const sortOrderFilePath = path.join(this.environmentService.appRootPath.toString(), `${folderName}.json`);

        try {
            if (fs.existsSync(sortOrderFilePath)) {
                const data = fs.readFileSync(sortOrderFilePath, 'utf8');
                const sortOrder = JSON.parse(data);
                this.customSortOrderMap.set(folderUri, sortOrder);
            }
        } catch (error) {
            console.error('Error loading custom sort order for', folderUri, ':', error);
        }
    }

    private writeSortOrderFile(folderUri: string, sortOrder: string[]): void {
        const folderName = path.basename(folderUri);
        const sortOrderFilePath = path.join(this.environmentService.appRootPath.toString(), `${folderName}.json`);
    
        try {
            const data = JSON.stringify(sortOrder, null, 4);
            fs.writeFileSync(sortOrderFilePath, data, 'utf8');
        } catch (error) {
            console.error('Error writing sort order file for', folderUri, ':', error);
        }
    }  

    // TODO: Add new methods to handle drag and drop events and update sort files
    // private handleDragAndDrop(draggedItem, targetFolder) {
    //     // Implement drag-and-drop processing logic
    // }

    // private updateOrderInSameFolder(draggedItem, targetFolder) {
    //     //Update the sorting within the same folder
    // }

    // private updateOrderAcrossFolders(draggedItem, targetFolder) {
    //     //Update sorting across folders
    // }

    // TODO: Add self-checking-loop method
}

// TODO: @AAsteria
// TODO: @duckSoup0203
class CustomFileTreeSorter extends Disposable {

    // [fields]
    private customSortOrder: string[];

    // [constructor]

    constructor(customSortOrder: string[]) {
        super();
        this.customSortOrder = customSortOrder;
    }

    // [public methods]

    public compare(a: FileItem, b: FileItem): number {
        const customSortOrder = this.customSortOrder;
        const indexA = customSortOrder.indexOf(a.name);
        const indexB = customSortOrder.indexOf(b.name);

        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        } else if (indexA !== -1) {
            return -1;
        } else if (indexB !== -1) {
            return 1;
        } else {
            // Default sorting logic
            if (a.type === b.type) {
                return (a.name < b.name) ? -1 : 1;
            } else if (a.isDirectory()) {
                return -1;
            } else {
                return 1;
            }
        }
    }
}