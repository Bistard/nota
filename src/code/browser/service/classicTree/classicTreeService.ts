import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ClassicOpenEvent, ClassicTree, IClassicTree } from "src/code/browser/service/classicTree/classicTree";
import { IFileService } from "src/code/platform/files/common/fileService";
import { ClassicChildrenProvider, ClassicItem } from "src/code/browser/service/classicTree/classicItem";
import { ITreeService } from "src/code/browser/service/explorerTree/treeService";
import { Disposable } from "src/base/common/dispose";
import { ClassicItemProvider, ClassicRenderer } from "src/code/browser/service/classicTree/classicRenderer";
import { ClassicDragAndDropProvider } from "src/code/browser/service/classicTree/classicDragAndDrop";
import { ILogService } from "src/base/common/logger";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { IFilterOpts } from "src/base/common/fuzzy";

export interface IClassicTreeService extends ITreeService<ClassicOpenEvent> {

}

/**
 * // TODO
 */
export class ClassicTreeService extends Disposable implements IClassicTreeService {

    // [event]

    get onDidClick(): Register<ClassicOpenEvent> {
        return this._tree!.onDidClick;
    };

    // [field]

    private _tree?: IClassicTree<ClassicItem, void>;

    // [constructor]

    constructor(
        @IConfigService private readonly configService: IConfigService,
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
        return (this._tree ? this._tree.root().uri : undefined);
    }
    
    get isOpened(): boolean {
        return !!this._tree;
    }
    
    // [public mehtods]
    
    public async init(container: HTMLElement, root: URI): Promise<void> {
        try {
            const IFilterOpts: IFilterOpts = {
                exclude: this.configService.get<string[]>(BuiltInConfigScope.User, 'actionView.explorer.exclude', []).map(s => new RegExp(s)),
                include: this.configService.get<string[]>(BuiltInConfigScope.User, 'actionView.explorer.include', []).map(s => new RegExp(s)),
            };

            const rootStat = await this.fileService.stat(root, { resolveChildren: true });
            const rootItem = new ClassicItem(rootStat, null, IFilterOpts);
            await this.__createTree(container, rootItem, IFilterOpts);
            this._tree?.onTouchstart(e => {
                console.log(e);
            });
        }
        catch (error) {
            throw error;
        }
    }
    
    public layout(height?: number | undefined): void {
        this._tree?.layout(height);
    }
    
    public async refresh(): Promise<void> {
        this._tree?.refresh(undefined);
    }
    
    public async close(): Promise<void> {
        // TODO
    }
    
    // [private helper methods]

    /**
     * @description Creates the tree structure by the given URI asynchronously.
     * @param container The HTMLElement container of the tree view.
     * @param root The root element of the tree.
     * @param filters The filter options during tree creation.
     * 
     * @note The related event will fire once the tree is created.
     */
    private async __createTree(container: HTMLElement, root: ClassicItem, filters: IFilterOpts): Promise<void> {

        const [tree, treeCreationPromise] = ClassicTree.createTree<ClassicItem, void>(
            container, 
            root,
            [new ClassicRenderer()], 
            new ClassicItemProvider(),
            new ClassicChildrenProvider(this.logService, this.fileService, filters),
            {
                collapseByDefault: true,
                dnd: new ClassicDragAndDropProvider(),
            },
        );

        this._tree = tree;
        this.__register(tree);
        return treeCreationPromise;
    }
}