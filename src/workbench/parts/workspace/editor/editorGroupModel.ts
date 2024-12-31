import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { MRU } from "src/base/common/utilities/mru";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";

/**
 * // TODO
 */
export interface IReadonlyEditorGroupModel extends Disposable {
    
    /**
     * The size of the editor group. Indicates how many editors the group is 
     * opening.
     */
    readonly sizes: number;

    getEditors(order: 'sequential' | 'mru'): EditorPaneModel[];
    getEditorByIndex(index: number): EditorPaneModel | undefined;
    indexOf(model: EditorPaneModel): number;
    contains(model: EditorPaneModel): boolean;
    isFirst(model: EditorPaneModel): boolean;
	isLast(model: EditorPaneModel): boolean;
}

/**
 * // TODO
 */
export interface IEditorGroupModel extends IReadonlyEditorGroupModel {

    /**
     * @event
     * Fires whenever the data of the model changes.
     */
    readonly onDidChangeModel: Register<void>;

    openEditor(model: EditorPaneModel): IEditorGroupOpenResult;
}

export interface IEditorGroupOpenResult {
    readonly model: EditorPaneModel;
    readonly existed: boolean;
}

/**
 * @implements
 */
class ReadonlyEditorGroupModel extends Disposable implements IReadonlyEditorGroupModel {

    // [fields]

    private readonly _editors: EditorPaneModel[];
    private readonly _mru: MRU<EditorPaneModel>;

    // [constructor]
    
    constructor() {
        super();
        this._editors = [];
        this._mru = new MRU<EditorPaneModel>((a, b) => a.equals(b), []);
    }
    
    // [getter]

    get sizes() { return this._editors.length; }

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

    // [event]

    private readonly _onDidChangeModel = this.__register(new Emitter<void>());
    public readonly onDidChangeModel = this._onDidChangeModel.registerListener;
    
    // [constructor]

    constructor() {
        super();
    }

    // [public methods (writable)]

    public openEditor(model: EditorPaneModel): IEditorGroupOpenResult {
        // TODO
        return { model: model, existed: false };
    }
}