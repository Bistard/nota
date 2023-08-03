import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { IClassicOpenEvent, ClassicTree, IClassicTree } from "src/workbench/services/classicTree/classicTree";
import { IFileService } from "src/platform/files/common/fileService";
import { ClassicChildrenProvider, ClassicItem } from "src/workbench/services/classicTree/classicItem";
import { ITreeService } from "src/workbench/services/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { ClassicItemProvider, ClassicRenderer } from "src/workbench/services/classicTree/classicRenderer";
import { ClassicDragAndDropProvider } from "src/workbench/services/classicTree/classicDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { ClassicFilter } from "src/workbench/services/classicTree/classicFilter";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { SideViewConfiguration } from "src/workbench/parts/sideView/configuration.register";

export interface IClassicTreeService extends ITreeService<ClassicItem> {

}

/**
 * // TODO
 */
export class ClassicTreeService extends Disposable implements IClassicTreeService {

    _serviceMarker: undefined;

    // [event]

    get onSelect(): Register<IClassicOpenEvent<ClassicItem>> {
        return this._tree!.onSelect;
    }

    // [field]

    private _tree?: IClassicTree<ClassicItem, void>;

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
        try {
            const filterOpts: IFilterOpts = {
                exclude: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewExclude, []).map(s => new RegExp(s)),
                include: this.configurationService.get<string[]>(SideViewConfiguration.ExplorerViewInclude, []).map(s => new RegExp(s)),
            };

            // resolve the root of the directory first
            const rootStat = await this.fileService.stat(root, { resolveChildren: true });
            const rootItem = new ClassicItem(rootStat, null, filterOpts);

            // construct the file system hierarchy
            const dndProvider = new ClassicDragAndDropProvider(this.fileService);
            this._tree = this.__register(
                new ClassicTree<ClassicItem, FuzzyScore>(
                    container,
                    rootItem,
                    {
                        itemProvider: new ClassicItemProvider(),
                        renderers: [new ClassicRenderer()],
                        childrenProvider: new ClassicChildrenProvider(this.logService, this.fileService, filterOpts),
                        identityProvider: { getID: (data: ClassicItem) => URI.toString(data.uri) },

                        // optional
                        collapsedByDefault: true,
                        filter: new ClassicFilter(),
                        dnd: dndProvider,
                    },
                )
            );
            dndProvider.bindWithTree(this._tree);

            await this._tree.refresh();
        }
        catch (error) {
            throw error;
        }
    }

    public layout(height?: number | undefined): void {
        this._tree?.layout(height);
    }

    public async refresh(data?: ClassicItem): Promise<void> {
        this._tree?.refresh(data);
    }

    public async close(): Promise<void> {
        // TODO
    }
}