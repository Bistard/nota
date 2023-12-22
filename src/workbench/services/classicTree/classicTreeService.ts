import { Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IFileTreeOpenEvent, FileTree, IFileTree as IFileTree } from "src/workbench/services/classicTree/classicTree";
import { IFileService } from "src/platform/files/common/fileService";
import { FileItemChildrenProvider as FileChildrenProvider, FileItem as FileItem } from "src/workbench/services/classicTree/classicItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { FileItemProvider as FileItemProvider, FileItemRenderer as FileItemRenderer } from "src/workbench/services/classicTree/classicRenderer";
import { FileItemDragAndDropProvider } from "src/workbench/services/classicTree/classicDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { FileItemFilter as FileItemFilter } from "src/workbench/services/classicTree/classicFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";

export interface IFileTreeService extends ITreeService<FileItem> {

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

    private _tree?: IFileTree<FileItem, void>;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
    ) {
        super();
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
        const filterOpts: IFilterOpts = {
            exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
            include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
        };

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
                    childrenProvider: new FileChildrenProvider(this.logService, this.fileService, filterOpts),
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
}