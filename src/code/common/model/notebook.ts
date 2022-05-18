import { AsyncMultiTree, IAsyncMultiTree } from "src/base/browser/secondary/tree/asyncMultiTree";
import { RendererType } from "src/base/browser/secondary/listView/listRenderer";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ExplorerChildrenProvider, ExplorerItem, ExplorerItemProvider } from "src/code/browser/workbench/actionView/explorer/explorerItem";
import { ExplorerRenderer } from "src/code/browser/workbench/actionView/explorer/explorerRenderer";
import { IFileService } from "src/code/common/service/fileService/fileService";

export interface INotebook {

    /**
     * Fires when the notebook is creation process is finished. True if it 
     * successed, false vice versa.
     * 
     * @note The event is needed since the whole process is asynchronous.
     */
    onDidCreationFinished: Register<boolean>;

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
     * sets to `true` once the tree is created.
     */
    private _created: boolean = false;

    /**
     * If the notebook is visible
     */
    private _visible: boolean = false;

    // [event]

    private _onDidCreationFinished = this.__register(new Emitter<boolean>());
    public onDidCreationFinished = this._onDidCreationFinished.registerListener;

    // [constructor]

    constructor(
        root: URI, 
        container: HTMLElement,
        private fileService: IFileService,
    ) {
        super();

        this._container = container;

        this.fileService.stat(root, { resolveChildren: true })
        .then(rootStat => {
        
            this._root = new ExplorerItem(rootStat, fileService);
            this.__createTree(container);

            this._created = true;
            this._visible = true;
            this._onDidCreationFinished.fire(true);
        })
        .catch(err => {
            // logService.trace(err);
            this._onDidCreationFinished.fire(false);
        });
        
    }

    // [get method]

    get name(): string { return this._root.name; }

    // [public method]

    public setVisible(value: boolean): void {
        
        if (!this._created || this._visible === value) {
            return;
        }

        if (value) {
            this._container.removeChild(this._tree.DOMElement);
        } else {
            this._container.appendChild(this._tree.DOMElement);
        }
        
    }

    public isVisible(): boolean {
        return this._visible;
    }

    /**
     * @description converts the whole file tree into JSON format.
     */
    public toJSON(): string {
        return JSON.stringify(this._tree, this.__mapToJsonReplacer, 2);
    }

    /**
     * @description destroy the notebook instance.
     */
    public destory(): void {
        
    }

    // [private]

    /**
     * @description Creates the tree structure by the given URI asynchronously.
     * @param container The HTMLElement container of the tree view.
     * 
     * @note The related event will fire once the tree is created.
     */
    private async __createTree(container: HTMLElement): Promise<void> {

        this._tree = this.__register(await AsyncMultiTree.create<ExplorerItem, void>(
            container, 
            this._root,
            [new ExplorerRenderer()], 
            new ExplorerItemProvider(),
            new ExplorerChildrenProvider(),
            {
                onDidCreateNode: (node) => {
                    const asyncNode = node.data;
                    asyncNode.data
                }
            }
        ));
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

}