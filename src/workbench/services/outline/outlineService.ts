import { MultiTree } from "src/base/browser/secondary/tree/multiTree";
import { ITreeNodeItem } from "src/base/browser/secondary/tree/tree";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Result, err, ok } from "src/base/common/result";
import { Stack } from "src/base/common/structures/stack";
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
    readonly id: number;

    /** 
     * The name of the target. 
     * @example file.js
     */
    readonly name: string;

    /** 
     * The heading level of the target. 
     */
    readonly depth: number;

    /**
     * The direct parent of the current item, if the current item is the root, 
     * return `null`.
     */
    readonly parent: OutlineItem | null;

    /**
     * Returns the root of the entire tree.
     */
    readonly root: OutlineItem;
}

export class OutlineItem implements IOutlineItem<OutlineItem> {

    // [field]

    private readonly _id: number;
    private readonly _name: string;
    private readonly _depth: number;

    private _parent: OutlineItem | null;
    private _children: OutlineItem[];

    // [constructor]

    constructor(id: number, name: string, depth: number) {
        this._id = id;
        this._name = name;
        this._depth = depth;
        this._parent = null;
        this._children = [];
    }

    get id(): number {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get depth(): number {
        return this._depth;
    }

    get children(): OutlineItem[] {
        return this._children;
    }

    get parent(): OutlineItem | null {
        return this._parent;
    }

    get root(): OutlineItem {
        if (this._parent === null) {
            return this;
        }
        return this._parent.root;
    }

    public addChild(child: OutlineItem): void {
        this._children.push(child);
        child._parent = this;
    }

    public addChildren(children: OutlineItem[]): void {
        this._children = this._children.concat(children);
        children.forEach(child => child._parent = this);
    }
}

/**
 * An interface only for {@link OutlineService}.
 */
export interface IOutlineService extends IService, Disposable {
    
    /**
     * Represents the root URI of the current opening outline file.
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

    public init(content: string[]): Result<void, Error> {
        this.logService.debug('OutlineService', 'Initializing...');
    
        const outlineContainerResult = this.__renderOutline().unwrap();

        const root = this.__convertContentToTree(content);
    
        this.__setupTree(outlineContainerResult, root);
    
        return ok();
    }
    
    
    public close(): void {
        this.logService.debug('OutlineService', 'Closing...');

        if (this._tree) {
            this._tree.dispose();
            this._tree = undefined;
        }

        const container = document.getElementById('workspace');
        const outlineContainer = container?.getElementsByClassName('outline')[0];
        if (outlineContainer) {
            container.removeChild(outlineContainer);
        }
    
        this._onDidRender.dispose();
        this._onDidClick.dispose();
        super.dispose();
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
            
            // close before init
            this.close();
            
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

    private __renderOutline(): Result<HTMLDivElement, Error> {
        this.logService.debug('OutlineService', 'Rendering outline...');
    
        const container = document.getElementById('workspace');
        if (!container) {
            console.error("Failed to find the workspace container element");
            return err(new Error("Workspace container element not found."));
        }
    
        const outlineContainer = document.createElement('div');
        outlineContainer.className = 'outline';
        container.appendChild(outlineContainer);
    
        return ok(outlineContainer);
    }
    
    private __convertContentToTree(content: string[]): ITreeNodeItem<OutlineItem> {
        return convertContentToTree(content);
    }

    private __setupTree(outlineContainer: HTMLDivElement, root: ITreeNodeItem<OutlineItem>): void {
        this.logService.debug('OutlineService', 'Setting up the tree...');
        const tree = new MultiTree<OutlineItem, void>(
            outlineContainer,
            root.data,
            [new OutlineItemRenderer()],
            new OutlineItemProvider(),
            { forcePrimitiveType: true }
        );
    
        tree.splice(root.data, root.children);
        tree.layout();
    }   
}

/**
 * Converts an array of markdown content strings to a tree structure of OutlineItems.
 * @param content Array of markdown lines to be converted.
 * @returns The root node of the tree structure.
 */
export function convertContentToTree(content: string[]): ITreeNodeItem<OutlineItem> {
    const root: ITreeNodeItem<OutlineItem> = {
        data: new OutlineItem(0, "Root", 0),
        children: []
    };

    const stack = new Stack<ITreeNodeItem<OutlineItem>>();
    stack.push(root);

    content.forEach((line, lineNumber) => {
        let level = 0;
        while (line.charAt(level) === '#') {
            level++;
        }

        // Not a heading
        if (level === 0) return;
    
        const name = line.slice(level + 1).trim();
        const newItem = new OutlineItem(lineNumber, name, level);
        const newNode: ITreeNodeItem<OutlineItem> = { data: newItem, children: [] };

        // Backtrack to find the correct parent level
        while (stack.top().data.depth >= level) {
            stack.pop();
        }

        stack.top().children!.push(newNode);
        stack.push(newNode);
    });

    return root;
}