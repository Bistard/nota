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
<<<<<<< Updated upstream:src/workbench/services/fileTree/fileTreeService.ts
import { CompareFn } from "src/base/common/utilities/type";

export interface IFileTreeService extends ITreeService<FileItem> {
=======
import * as fs from 'fs';
import * as path from 'path';
import { CompareFn } from "src/base/common/util/type";
export interface IClassicTreeService extends ITreeService<ClassicItem> {
>>>>>>> Stashed changes:src/workbench/services/classicTree/classicTreeService.ts

}

/**
 * // TODO
 */
export class FileTreeService extends Disposable implements IFileTreeService {

    declare _serviceMarker: undefined;

    // [event]

    get onSelect(): Register<IFileTreeOpenEvent<FileItem>> {
        return this._tree!.onSelect;
    }

    // [field]

<<<<<<< Updated upstream:src/workbench/services/fileTree/fileTreeService.ts
    private _tree?: IFileTree<FileItem, void>;
=======
    private _tree?: IClassicTree<ClassicItem, void>;
    private customSortOrder: string[] = [];
>>>>>>> Stashed changes:src/workbench/services/classicTree/classicTreeService.ts

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
        this.loadCustomSortOrder();
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
        const compareFunction = ifSupportFileSorting ? (new FileTreeCustomSorting()).compare : defaultFileItemCompareFn;

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
<<<<<<< Updated upstream:src/workbench/services/fileTree/fileTreeService.ts
}

// TODO: @AAsteria
// TODO: @duckSoup0203
class FileTreeCustomSorting extends Disposable {

    // [fields]

    // [constructor]

    constructor() {
        super();
=======

    private loadCustomSortOrder(): void {
        try {
            const sortOrderPath = path.join(__dirname, 'sorting.json'); //不要json
            if (fs.existsSync(sortOrderPath)) {
                const data = fs.readFileSync(sortOrderPath, 'utf8');
                this.customSortOrder = JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading custom sort order:', error);
            this.customSortOrder = [];
        }
    }
}

class FileTreeCustomSorting extends Disposable {

    // [fields]
    private customSortOrder: string[];

    // [constructor]

    constructor(customSortOrder: string[]) {
        super();
        this.customSortOrder = customSortOrder;
>>>>>>> Stashed changes:src/workbench/services/classicTree/classicTreeService.ts
    }

    // [public methods]

<<<<<<< Updated upstream:src/workbench/services/fileTree/fileTreeService.ts
    public compare(a: FileItem, b: FileItem): number {
=======
    public compare(a: ClassicItem, b: ClassicItem): number {
>>>>>>> Stashed changes:src/workbench/services/classicTree/classicTreeService.ts
        return -1;
    }

    // [private helper methods]
<<<<<<< Updated upstream:src/workbench/services/fileTree/fileTreeService.ts
=======

    private __buildFileSortingFunction(): CompareFn<ClassicItem> {
        
        // TODO: customzied FileItem sorting
        // TODO: @AAsteria
        // TODO: @duckSoup0203
     
        return (a: ClassicItem, b: ClassicItem): number => {
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
        };
    }
>>>>>>> Stashed changes:src/workbench/services/classicTree/classicTreeService.ts
}