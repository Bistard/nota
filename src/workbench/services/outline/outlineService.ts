import { MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Result, err, ok } from "src/base/common/result";
import { assert, panic } from "src/base/common/utilities/panic";
import { ICommandService } from "src/platform/command/common/commandService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { OutlineItemProvider, OutlineItemRenderer } from "src/workbench/services/outline/outlineItemRenderer";
import { AllCommands } from "src/workbench/services/workbench/commandList";

export const IOutlineService = createService<IOutlineService>('outline-service');

/**
 * An interface only for {@link Outlineltem}.
 */
export interface IOutlineItem<TItem extends IOutlineItem<TItem>> {

    /** 
     * The unique representation of the target. 
     */
    readonly id: string;

    /** 
     * The name of the target. 
     * @example file.js
     */
    readonly name: string;

    /** 
     * The heading level of the target. 
     */
    readonly depth: number;
}

export class OutlineItem implements IOutlineItem<OutlineItem> {

    // [field]

    private readonly _id: string;
    private readonly _name: string;
    private readonly _depth: number;
    private _children: OutlineItem[] = [];

    // [constructor]

    constructor(id: string, name: string, depth: number) {
        this._id = id;
        this._name = name;
        this._depth = depth;
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get depth(): number {
        return this._depth;
    }

    public get children(): OutlineItem[] {
        return this._children;
    }

    public addChild(child: OutlineItem): void {
        this._children.push(child);
    }

    public addChildren(children: OutlineItem[]): void {
        this._children = this._children.concat(children);
    }
}

/**
 * An interface only for {@link OutlineService}.
 */
export interface IOutlineService extends IService, Disposable {
    
    /**
     * Represents the root URI of the current openning outline file.
     * @note Returns `null` if the service is not initialized.
     */
    readonly root: URI | null;

    /**
     * Fires every time once the outline view finishes rendering.
     */
    readonly onDidRender: Register<void>;

    /**
     * Fires when any heading is clicked from the view.
     */
    readonly onDidClick: Register<string>;

    /**
     * @description Initialize the outline rendering next to the editor. Once
     * invoked, the service will start listening to any heading-related changes 
     * from the editor and update it on the outline view.
     * @param content An array of content in string from the file, every string 
     *                represent a row of a file.
     */
    init(content: string[]): Result<void, Error>;

    /**
     * @description Destroy the entire outline view and releases related 
     * memories. After `close()` the outline service can still be reinitialized.
     */
    close(): void;
}

export class OutlineService extends Disposable implements IOutlineService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onDidRender = this.__register(new Emitter<void>());
    public readonly onDidRender = this._onDidRender.registerListener;
    
    private readonly _onDidClick = this.__register(new Emitter<string>());
    public readonly onDidClick = this._onDidClick.registerListener;

    // [fields]

    private _currFile?: URI; // The URI of the current file being used to display the outline. 
    private _tree?: MultiTree<OutlineItem, void>; // the actual tree view

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IEditorService private readonly editorService: IEditorService,
        @ICommandService private readonly commandService: ICommandService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {
        super();
        this.logService.debug('OutlineService', 'Constructed.');
        
        this._tree = undefined;
        this._currFile = undefined;

        this.__registerListeners();
    }

    // [getter]

    get root(): URI | null {
        return this._currFile ?? null;
    }

    // [public methods]

    // 1. 遍历，把一个array of string变成一个array of outlineItem，处理#
    // 2. 转化成tree structure
    public init(content: string[]): Result<void, Error> {
        this.logService.debug('OutlineService', 'Initializing...');
        const container = document.getElementById('workspace');

        const outlineContainer = document.createElement('div');
        outlineContainer.className = 'outline';
        if (!container) {
            console.error("Failed to find the outline container element");
            return err(new Error("Container element not found."));
        }
        container.appendChild(outlineContainer);
        console.log('Outline container appended to workspace.');
    
        const renderer = new OutlineItemRenderer();
        const itemProvider = new OutlineItemProvider();
    
        const rootData = new OutlineItem("0", "rootnode", 0);
        this._tree = new MultiTree<OutlineItem, void>(
            outlineContainer, rootData, [renderer], itemProvider, {forcePrimitiveType: true});

        if (this._tree) {
            outlineContainer.appendChild(this._tree.DOMElement);
        }
        const childNodes: ITreeNodeItem<OutlineItem>[] = [
            { data: new OutlineItem("1", "heading1", 1) },
            { data: new OutlineItem("1.1", "heading2", 2) },
            { data: new OutlineItem("2", "heading1", 1) },
            { data: new OutlineItem("2.1", "heading2", 2) },
        ];
        
        this._tree.splice(rootData, childNodes);
        this._tree.layout();
        return ok();
    }

    public close(): void {
        //释放所有资源
        this.logService.debug('OutlineService', 'Closing...');
        panic('not implemented');
    }

    public override dispose(): void {
        this.close();
        super.dispose();
    }

    // [private helper methods]

    private async __registerListeners(): Promise<void> {

        /**
         * Make sure the outline is only able to init after the crucial UIs are 
         * created.
         */
        await this.lifecycleService.when(LifecyclePhase.Displayed);
        
        // init when needed
        this.__register(this.editorService.onDidOpen(uri => {
            
            // make sure no excessive rendering for the same file
            if (this._currFile && URI.equals(uri, this._currFile)) {
                return;
            }
            
            // TODO: close before init
            // this.close();
            
            // init
            const editor = assert(this.editorService.editor);
            this.init(editor.model.getContent())
                .match(
                    () => {
                        this._currFile = editor.model.source;
                        this.logService.debug('OutlineService', 'Initialized successfully.');
                    },
                    error => this.commandService.executeCommand(AllCommands.alertError, 'OutlineService', error),
                );
        }));
    }
}