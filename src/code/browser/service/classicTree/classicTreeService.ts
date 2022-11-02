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
import { FuzzyScore, IFilterOpts } from "src/base/common/fuzzy";
import { ClassicFilter } from "src/code/browser/service/classicTree/classicFilter";

export interface IClassicTreeService extends ITreeService<ClassicItem> {

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
        return (this._tree ? this._tree.root.uri : undefined);
    }
    
    get isOpened(): boolean {
        return !!this._tree;
    }
    
    // [public mehtods]
    
    public async init(container: HTMLElement, root: URI): Promise<void> {
        try {
            const filterOpts: IFilterOpts = {
                exclude: this.configService.get<string[]>(BuiltInConfigScope.User, 'actionView.explorer.exclude', []).map(s => new RegExp(s)),
                include: this.configService.get<string[]>(BuiltInConfigScope.User, 'actionView.explorer.include', []).map(s => new RegExp(s)),
            };

            // resolve the root of the directory first
            const rootStat = await this.fileService.stat(root, { resolveChildren: true });
            const rootItem = new ClassicItem(rootStat, null, filterOpts);
            
            // create the actual file system hierarchy
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
                        dnd: new ClassicDragAndDropProvider(),
                    },
                )
            );

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