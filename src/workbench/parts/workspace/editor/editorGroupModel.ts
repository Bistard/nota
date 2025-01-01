import { Disposable, DisposableManager, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { MRU } from "src/base/common/utilities/mru";
import { Numbers } from "src/base/common/utilities/number";
import { isDefined } from "src/base/common/utilities/type";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";

/**
 * // TODO
 */
export interface IReadonlyEditorGroupModel extends Disposable {
    
    /**
     * @event
     * Fires whenever the data of the model changes.
     */
    readonly onDidChangeModel: Register<IEditorGroupChangeEvent>;

    /**
     * The size of the editor group. Indicates how many editors the group is 
     * opening.
     */
    readonly size: number;

    getEditors(order: 'sequential' | 'mru'): EditorPaneModel[];
    getEditorByIndex(index: number): EditorPaneModel | undefined;
    find(model: EditorPaneModel): { model: EditorPaneModel, index: number } | undefined;
    indexOf(model: EditorPaneModel): number;
    contains(model: EditorPaneModel): boolean;
    isFirst(model: EditorPaneModel): boolean;
	isLast(model: EditorPaneModel): boolean;
}

/**
 * // TODO
 */
export interface IEditorGroupModel extends IReadonlyEditorGroupModel {

    openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult;
    closeEditor(model: EditorPaneModel): IEditorGroupCloseResult | undefined;
    moveEditor(model: EditorPaneModel, to: number): IEditorGroupMoveResult | undefined;
}

export interface IEditorGroupOpenOptions {
    readonly index?: number;
}

export interface IEditorGroupOpenResult {
    readonly model: EditorPaneModel;
    readonly existed: boolean;
}

export interface IEditorGroupCloseResult {
    readonly model: EditorPaneModel;
    readonly index: number;
}

export interface IEditorGroupMoveResult {
    readonly model: EditorPaneModel;
    readonly from: number;
    readonly to: number;
}

export const enum EditorGroupChangeType {
    SELECTION, // TODO
    SELECTION_ACTIVE, // TODO

    EDITOR_OPEN,
    EDITOR_CLOSE,
    EDITOR_MOVE,
}

export interface IEditorGroupChangeEvent {
	/**
	 * The type of change that occurred in the group model.
	 */
	readonly type: EditorGroupChangeType;
	readonly model: EditorPaneModel;
	readonly modelIndex: number;
}

/**
 * @implements
 */
class ReadonlyEditorGroupModel extends Disposable implements IReadonlyEditorGroupModel {

    // [events]

    protected readonly _onDidChangeModel = this.__register(new Emitter<IEditorGroupChangeEvent>());
    public readonly onDidChangeModel = this._onDidChangeModel.registerListener;

    // [fields]

    protected readonly _editors: EditorPaneModel[];
    protected readonly _mru: MRU<EditorPaneModel>;

    protected readonly _editorListeners: Set<IDisposable>;

    // [constructor]
    
    constructor() {
        super();
        this._editors = [];
        this._mru = new MRU<EditorPaneModel>((a, b) => a.equals(b), []);
        this._editorListeners = new Set();
    }
    
    // [getter]

    get size() { return this._editors.length; }

    // [public methods (readonly)]

    public getEditors(order: 'sequential' | 'mru'): EditorPaneModel[] {
        return order === 'sequential' 
            ? this._editors.slice(0) 
            : this._mru.getItems()
        ;
    }

    public getEditorByIndex(index: number): EditorPaneModel | undefined {
        return this._editors[index];
    }

    public find(model: EditorPaneModel): { model: EditorPaneModel, index: number } | undefined {
        const index = this.indexOf(model);
        if (index === -1) {
            return undefined;
        }
        return { model: this.getEditorByIndex(index)!, index: index };
    }

    public indexOf(model: EditorPaneModel): number {
        return this._editors.findIndex(each => this.__isEqual(each, model));
    }

    public contains(model: EditorPaneModel): boolean {
        return this.indexOf(model) !== -1;
    }

    public isFirst(model: EditorPaneModel): boolean {
        return this.__isEqual(this._editors[0], model);
    }

    public isLast(model: EditorPaneModel): boolean {
        return this.__isEqual(this._editors[this._editors.length - 1], model);
    }

    // [private methods]

    private __isEqual(first: EditorPaneModel | null | undefined, second: EditorPaneModel | null | undefined): boolean {
        if (!first || !second) {
            return false;
        }
        return first.equals(second);
    }
}

export class EditorGroupModel extends ReadonlyEditorGroupModel implements IEditorGroupModel {

    // [constructor]

    constructor() {
        super();
    }

    // [public methods (writable)]

    public openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        const findResult = this.find(model);
        if (!findResult) {
            return this.__openNewEditor(model, options);
        } else {
            return this.__openExistEditor(findResult.model, options);
        }
    }

    public closeEditor(model: EditorPaneModel): IEditorGroupCloseResult | undefined {
        const existedIndex = this.indexOf(model);
        if (existedIndex === -1) {
            return undefined;
        }
        
        const existed = this.getEditorByIndex(existedIndex)!;
        this.__splice(existedIndex, true);

        this.__fire(EditorGroupChangeType.EDITOR_CLOSE, model, existedIndex);

        return {
            model: existed,
            index: existedIndex,
        };
    }

    public moveEditor(model: EditorPaneModel, to: number): IEditorGroupMoveResult | undefined {
        const existedIndex = this.indexOf(model);
        if (existedIndex === -1) {
            return;
        }
        
        const targetIndex = Numbers.clamp(to, 0, this.size);
        if (existedIndex === targetIndex) {
            return;
        }

        const existedModel = this.getEditorByIndex(existedIndex)!;
        this.__splice(existedIndex, true);
        this.__splice(targetIndex, false, existedModel);

        this.__fire(EditorGroupChangeType.EDITOR_MOVE, model, targetIndex);

        return {
            model: existedModel,
            from: existedIndex,
            to: targetIndex,
        };
    }

    // [private methods]

    private __openNewEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        const targetIndex = options.index ?? this.size;
        
        this.__splice(targetIndex, false, model);
        this.__registerModelListeners(model);

        this.__fire(EditorGroupChangeType.EDITOR_OPEN, model, targetIndex);

        return { 
            model, 
            existed: false,
        };
    }

    private __openExistEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        
        this._mru.use(model);

        // move to a new index if required
        if (isDefined(options.index)) {
            this.moveEditor(model, options.index);
        }

        return { 
            model, 
            existed: true,
        };
    }

    private __splice(index: number, del: boolean, model?: EditorPaneModel): void {
        if (!Numbers.isValidIndex(index, this.size + 1)) {
            return;
        }
        const target = this.getEditorByIndex(index)!;
        const delCount = del ? 1 : 0;

        // splice to the sequential array
        if (model) {
            this._editors.splice(index, delCount, model);
        } else {
            this._editors.splice(index, delCount);
        }

        // splice to the mru
        if (model) {
            this._mru.use(model);
        }
        if (delCount) {
            this._mru.remove(target);
        }
    }

    private __registerModelListeners(model: EditorPaneModel): void {
        const lifecycle = new DisposableManager();
        this._editorListeners.add(lifecycle);

        // Clean up listeners once the editor gets closed
        lifecycle.register(this.onDidChangeModel(e => {
            if (
                e.model.equals(model) &&
                e.type === EditorGroupChangeType.EDITOR_CLOSE
            ) {
                lifecycle.dispose();
                this._editorListeners.delete(lifecycle);
            }
        }));
    }

    private __fire(type: EditorGroupChangeType, model: EditorPaneModel, index: number): void {
        this._onDidChangeModel.fire({
            type: type,
            model: model,
            modelIndex: index,
        });
    }
}