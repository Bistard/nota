import { IListDragAndDropProvider } from "src/base/browser/secondary/listWidget/listWidgetDragAndDrop";
import { AsyncMultiTree, IAsyncMultiTree } from "src/base/browser/secondary/tree/asyncMultiTree";
import { ITreeMouseEvent, ITreeSpliceEvent } from "src/base/browser/secondary/tree/tree";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ExplorerChildrenProvider, ExplorerItem, ExplorerItemProvider } from "src/code/browser/workbench/actionView/explorer/explorerItem";
import { ExplorerRenderer } from "src/code/browser/workbench/actionView/explorer/explorerRenderer";
import { IFileService } from "src/code/common/service/fileService/fileService";

/**
 * @class A type of {@link IListDragAndDropProvider} to support drag and drop
 * for {@link Notebook}.
 */
export class NotebookDragAndDropProvider implements IListDragAndDropProvider<ExplorerItem> {

    constructor() {

    }

    public getDragData(item: ExplorerItem): string | null {
        return item.uri.toString();
    }

    public onDragStart(): void {

    }

}

export interface INotebook {

    /**
     * Fires when the notebook is creation process is finished. True if it 
     * successed, false vice versa.
     * 
     * @note The event is needed since the whole process is asynchronous.
     */
    onDidCreationFinished: Register<boolean>;

    /**
     * Fires when the notebook visibility is changed. True if it sets to visible,
     * invisible vice versa.
     */
    onDidVisibilityChange: Register<boolean>;

    /**
     * Fires when the item in the notebook is clicked.
     */
    onClick: Register<ITreeMouseEvent<ExplorerItem>>;
    
    /**
     * Fires when the content of the notebook is changed.
     */
    onDidChangeContent: Register<ITreeSpliceEvent<ExplorerItem | null, void>>;

    /**
     * @description Sets the visibility of the notebook in the explorer.
     * @param value The provided value of visibility.
     * 
     * @note Invisible will remove the whole HTMLElement off the DOM tree. 
     * Visible will reinsert the HTMLElement back to the DOM tree.
     */
    setVisible(value: boolean): void;

    /**
     * @description Determines if the current notebook is visible in the explorer.
     */
    isVisible(): boolean;

    /**
     * @description Building the whole notebook asynchronously by the given root 
     * path.
     * @param root The root path.
     * @returns If the initialization successed. Undefined => fails.
     */
    init(root: URI): Promise<boolean>;

    /**
     * @description Given the height, re-layouts the height of the whole view.
     * @param height The given height.
     * 
     * @note If no values are provided, it will sets to the height of the 
     * corresponding DOM element of the view.
     */
    layout(height?: number): void;

    /**
     * @description Given the {@link ExplorerItem}, refresh the whole notebook 
     * structure asynchronously.
     * @param item The provided explorer item. Default is to refresh the whole 
     * notebook.
     */
    refresh(item?: ExplorerItem): Promise<void>;

    /**
     * @description Given the {@link URI}, selecting / displaying / expanding 
     * the corresponding item {@link ExplorerItem} in the view.
     * @param uri The URI of the item.
     * @returns A boolean determines whether the operation success.
     */
    select(uri: URI): Promise<boolean>;

}

/**
 * @description An constructor option for {@link Notebook}.
 */
export interface INotebookOptions {

}

/**
 * @class A class for each notebook.
 * 
 * @note The default visibility is true once the tree has been created.
 */
export class Notebook extends Disposable implements INotebook {

    // [field]

    private _root!: ExplorerItem;
    private _tree!: IAsyncMultiTree<ExplorerItem, void>;

    /**
     * The container of the whole notebook.
     */
    private _container: HTMLElement;

    /**
     * If the notebook is visible
     */
    private _visible: boolean = false;

    // [event]

    private readonly _onDidCreationFinished = this.__register(new Emitter<boolean>());
    public readonly onDidCreationFinished = this._onDidCreationFinished.registerListener;

    private readonly _onDidVisibilityChange = this.__register(new Emitter<boolean>());
    public readonly onDidVisibilityChange = this._onDidVisibilityChange.registerListener;

    get onClick() { return this._tree.onClick; }
    get onDidChangeContent() { return this._tree.onDidSplice; }

    // [constructor]

    constructor(
        container: HTMLElement,
        private fileService: IFileService,
        opts: INotebookOptions = {},
    ) {
        super();
        this._container = container;

    }

    // [get method]

    get name(): string { return this._root.name; }

    // [public method]

    public layout(height?: number): void {
        if (this._visible) {
            this._tree.layout(height);
        }
    }

    public async init(root: URI): Promise<boolean> {
        
        try {
            const rootStat = await this.fileService.stat(root, { resolveChildren: true });
            this._root = new ExplorerItem(rootStat);
            await this.__createTree(this._container, this._root);

            this.__registerListeners();

            this.__resolveState(true);
        }
        
        catch (err) {
            this.__resolveState(false);
            return false;
        }

        return true;
    }

    public setVisible(value: boolean): void {
        if (this._visible === value) {
            return;
        }

        if (!value) {
            this._container.removeChild(this._tree.DOMElement);
        } else {
            this._container.appendChild(this._tree.DOMElement);
        }

        this._onDidVisibilityChange.fire(value);
    }

    public isVisible(): boolean {
        return this._visible;
    }

    public refresh(item?: ExplorerItem): Promise<void> {
        return this._tree.refresh(item ?? this._tree.root());
    }

    public async select(uri: URI): Promise<boolean> {
        // TODO
        return false;
    }

    /**
     * @description converts the whole file tree into JSON format.
     */
    public toJSON(): string {
        return JSON.stringify(this._tree, this.__mapToJsonReplacer, 2);
    }

    // [private]

    /**
     * @description Creates the tree structure by the given URI asynchronously.
     * @param container The HTMLElement container of the tree view.
     * @param root The root element of the tree.
     * 
     * @note The related event will fire once the tree is created.
     */
    private async __createTree(container: HTMLElement, root: ExplorerItem): Promise<void> {

        const [tree, treeCreationPromise] = AsyncMultiTree.create<ExplorerItem, void>(
            container, 
            root,
            [new ExplorerRenderer()], 
            new ExplorerItemProvider(),
            new ExplorerChildrenProvider(this.fileService),
            {
                collapseByDefault: false,
                dnd: new NotebookDragAndDropProvider()
            }
        );

        this._tree = tree;
        this.__register(tree);
        return treeCreationPromise;
    }

    /**
     * @description Registers all the basic actions of the {@link Notebook}.
     */
    private __registerListeners(): void {

        this._tree.onClick(event => {
            if (event.data) {
                this._tree.toggleCollapseOrExpand(event.data, false);
            }
        });

    }

    /**
     * @description pass this function to JSON.stringify so that it is able to convert
     * native 'Map' type to JSON file.
     */
    private __mapToJsonReplacer(key: any, value: any) {
        if (value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        } else {
        return value;
        }
    }

    /**
     * @description Change the current notebook state by the given result.
     * @param result Result in boolean form.
     */
    private __resolveState(result: boolean): void {
        // TODO: this.setVisible(result);
        this._visible = result;
        this._onDidVisibilityChange.fire(result);
        this._onDidCreationFinished.fire(result);
    }

}