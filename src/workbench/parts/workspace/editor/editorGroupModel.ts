import { Disposable, DisposableManager, disposeAll, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { MRU } from "src/base/common/utilities/mru";
import { Numbers } from "src/base/common/utilities/number";
import { AtLeastOneArray, isDefined } from "src/base/common/utilities/type";
import { IConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";

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
    
    /**
     * The current selection of the editor group. The first item will always be
     * the focused one ({@link focused}).
     */
    readonly selection: EditorPaneModel[];

    /**
     * The focused editor of the editor group. Indicates the unique editor which 
     * is currently being viewed or selected.
     */
    readonly focused: EditorPaneModel | undefined;

    getEditors(order: 'sequential' | 'mru'): EditorPaneModel[];
    getEditorByIndex(index: number): EditorPaneModel | undefined;
    findEditor(model: EditorPaneModel): { model: EditorPaneModel, index: number } | undefined;
    indexOf(model: EditorPaneModel): number;
    contains(model: EditorPaneModel): boolean;
    isFirst(model: EditorPaneModel): boolean;
	isLast(model: EditorPaneModel): boolean;
    isSelected(model: EditorPaneModel): boolean;
    isFocused(model: EditorPaneModel): boolean;
}

/**
 * // TODO
 */
export interface IEditorGroupModel extends IReadonlyEditorGroupModel {
    openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult;
    closeEditor(model: EditorPaneModel, options: IEditorGroupCloseOptions): IEditorGroupCloseResult | undefined;
    moveEditor(model: EditorPaneModel, to: number): IEditorGroupMoveResult | undefined;
    setSelection(focused: EditorPaneModel | null, selection: EditorPaneModel[]): void;
    setFocused(focused: EditorPaneModel | null): void;
}

export interface IEditorGroupOpenOptions {
    readonly index?: number;
    readonly focused?: boolean;
}

export interface IEditorGroupOpenResult {
    readonly model: EditorPaneModel;
    readonly existed: boolean;
}

export interface IEditorGroupCloseOptions {
    readonly openAfterClose?: boolean;
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
    SELECTION,
    SELECTION_FOCUSED,

    EDITOR_OPEN,
    EDITOR_CLOSE,
    EDITOR_MOVE,
}

/**
 * Whenever open a new editor, indicates the position of the new editor relative
 * to the focused or relative to the entire groups.
 */
export const enum EditorGroupOpenPositioning {
    Left = 'left',
    Right = 'right',
    First = 'first',
    Last = 'last',
}

export interface IEditorGroupChangeEvent {
	/**
	 * The type of change that occurred in the group model.
	 */
	readonly type: EditorGroupChangeType;
	readonly model?: EditorPaneModel;
	readonly modelIndex?: number;
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

    protected _focused?: EditorPaneModel;
    protected _selection: EditorPaneModel[];

    // [constructor]
    
    constructor() {
        super();
        this._editors = [];
        this._mru = new MRU<EditorPaneModel>((a, b) => a.equals(b), []);
        this._editorListeners = new Set();
        this._selection = [];
    }
    
    // [getter]

    get size() { return this._editors.length; }
    get focused() { return this._selection[0]; }
    get selection() { return this._selection; }

    // [public methods (readonly)]

    public override dispose(): void {
        super.dispose();
        disposeAll(Array.from(this._editorListeners));
        this._editorListeners.clear();
    }

    public getEditors(order: 'sequential' | 'mru'): EditorPaneModel[] {
        return order === 'sequential' 
            ? this._editors.slice(0) 
            : this._mru.getItems()
        ;
    }

    public getEditorByIndex(index: number): EditorPaneModel | undefined {
        return this._editors[index];
    }

    public findEditor(model: EditorPaneModel): { model: EditorPaneModel, index: number } | undefined {
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

    public isSelected(model: EditorPaneModel): boolean {
        // excludes the focused
        return this.selection.slice(1, undefined).some(each => this.__isEqual(each, model));
    }
    
    public isFocused(model: EditorPaneModel): boolean {
        return this.__isEqual(model, this.focused);
    }

    // [private methods]

    protected __isEqual(first: EditorPaneModel | null | undefined, second: EditorPaneModel | null | undefined): boolean {
        if (!first || !second) {
            return false;
        }
        return first.equals(second);
    }
}

export class EditorGroupModel extends ReadonlyEditorGroupModel implements IEditorGroupModel {

    // [fields]

    private _focusRecentEditorAfterClose!: boolean;
    private _editorOpenPositioning!: EditorGroupOpenPositioning;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super();
        // init and listen to config changes
        this.__onConfigurationUpdate(null);
        this.__register(configurationService.onDidConfigurationChange(e => this.__onConfigurationUpdate(e)));
    }

    // [public methods (writable)]

    public openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        const findResult = this.findEditor(model);
        if (!findResult) {
            return this.__openNewEditor(model, options);
        } else {
            return this.__openExistEditor(findResult.model, options);
        }
    }

    public closeEditor(model: EditorPaneModel, options: IEditorGroupCloseOptions): IEditorGroupCloseResult | undefined {
        
        // editor not found to close
        const existed = this.findEditor(model);
        if (!existed) {
            return undefined;
        }
        const { model: existedModel, index: existedIndex } = existed;

        this.__updateSelectionBeforeClose(existedModel, existedIndex, options);
        this.__splice(existedIndex, true);
        this.__fire(EditorGroupChangeType.EDITOR_CLOSE, existedModel, existedIndex);

        return {
            model: existedModel,
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

    public setSelection(focused: EditorPaneModel | null, selection: EditorPaneModel[]): void {
        // clear selection
        if (!focused) {
            this.__setSelection(null, []);
            return;
        }
        
        // validate
        const validation = this.__validateSelection(focused, selection);
        if (validation === undefined) {
            return;
        }

        // do set selection
        const [focus, ...rest] = validation;
        this.__setSelection(focus, rest);
    }

    public setFocused(focused: EditorPaneModel | null): void {
        this.setSelection(focused, []);
    }

    // [private methods]

    private __validateSelection(focused: EditorPaneModel, selection: EditorPaneModel[]): AtLeastOneArray<EditorPaneModel> | undefined {
        const focusedFind = this.findEditor(focused);
        if (!focusedFind) {
            return undefined;
        }

        const validSelection = new Set<EditorPaneModel>();
        for (const each of selection) {
            const selectionFind = this.findEditor(each);
            if (!selectionFind) {
                continue;
            }
            
            if (this.__isEqual(focusedFind.model, selectionFind.model)) {
                continue;
            }

            validSelection.add(selectionFind.model);
        }

        return [focusedFind.model, ...Array.from(validSelection)];
    }

    private __setSelection(focused: EditorPaneModel | null, selection: EditorPaneModel[]): void {
        const prevFocused = this.focused;
        const prevSelection = this.selection;

        // update selection: only when focused is given.
        this._selection = focused ? [focused, ...selection] : [];

        // changed: focused editor
        const focusedChange = prevFocused !== focused && focused && !this.__isEqual(prevFocused, focused);
        if (focusedChange) {
            this._mru.use(focused);
            this.__fire(EditorGroupChangeType.SELECTION_FOCUSED, focused, this.indexOf(focused));
        }

        // changed: selection editors
        if (
            focusedChange ||
            this._selection.length !== prevSelection.length ||
            prevSelection.some(each => -1 !== this._selection.findIndex(curr => !this.__isEqual(each, curr)))
        ) {
            this.__fire(EditorGroupChangeType.SELECTION, undefined, undefined);
        }
    }

    private __updateSelectionBeforeClose(model: EditorPaneModel, index: number, options: IEditorGroupCloseOptions): void {
        
        // case I: focused editor closed
        if (this.isFocused(model)) {
            // case 1: only one editor, clear selection.
            if (this.size === 1) {
                this.setSelection(null, []);
            } 
            // case 2: more than one editor, chose which to open after close
            else if (options.openAfterClose) {
                const newFocused = this._focusRecentEditorAfterClose 
                    // mru case (choose the second recent used one)
                    ? this._mru.getRecent(1)! 
                    // normal case
                    : this.isLast(model)
                        ? this.getEditorByIndex(index - 1)!
                        : this.getEditorByIndex(index + 1)!;

                const newSelected = this.selection.filter(selected => !this.__isEqual(selected, model) && !this.__isEqual(selected, newFocused));
                this.setSelection(newFocused, newSelected);
            } 
            // case 3: more than one editor, nothing to open, clear selection.
            else {
                this.setSelection(null, []);
            }
        }
        // case II: selection editor closed
        else if (this.isSelected(model)) {
            const newSelected =this.selection.filter(selected => !this.__isEqual(selected, model) && !this.__isEqual(selected, this.focused));
            this.setSelection(this.focused ?? null, newSelected);
        }
    }

    private __calcNewEditorIndex(options: IEditorGroupOpenOptions): number {
        const focusedIndex = this.focused ? this.indexOf(this.focused) : 0;

        // case 1: specified by options
        if (isDefined(options.index)) {
            return Numbers.clamp(options.index, 0, this.size);
        }
        // case 2: insert at the beginning
        else if (this._editorOpenPositioning === EditorGroupOpenPositioning.First) {
            return 0;
        }
        // case 3: insert at the end
        else if (this._editorOpenPositioning === EditorGroupOpenPositioning.Last) {
            return this.size;
        }
        // case 4: insert to the left
        else if (this._editorOpenPositioning === EditorGroupOpenPositioning.Left) {
            return focusedIndex;
        }
        // case 4: insert to the right
        else if (this._editorOpenPositioning === EditorGroupOpenPositioning.Right) {
            return focusedIndex + 1;
        }

        return 0;
    }

    private __openNewEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        const targetIndex = this.__calcNewEditorIndex(options);
        const shouldFocused = options.focused || !this.focused;
        
        this.__splice(targetIndex, false, model);
        this.__registerModelListeners(model);

        this.__fire(EditorGroupChangeType.EDITOR_OPEN, model, targetIndex);

        // update selection
        this.setSelection(shouldFocused ? model : this.focused, []);

        return { 
            model, 
            existed: false,
        };
    }

    private __openExistEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): IEditorGroupOpenResult {
        const shouldFocused = options.focused || !this.focused;

        // update selection
        this.setSelection(shouldFocused ? model : this.focused, []);

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

        // todo: EDITOR_DIRTY bind

        // Clean up listeners once the editor gets closed
        lifecycle.register(this.onDidChangeModel(e => {
            if (
                e.model?.equals(model) &&
                e.type === EditorGroupChangeType.EDITOR_CLOSE
            ) {
                lifecycle.dispose();
                this._editorListeners.delete(lifecycle);
            }
        }));
    }

    private __fire(type: EditorGroupChangeType, model: EditorPaneModel | undefined, index: number | undefined): void {
        this._onDidChangeModel.fire({
            type: type,
            model: model,
            modelIndex: index,
        });
    }

    private __onConfigurationUpdate(e: IConfigurationChangeEvent | null): void {
        if (!e || e.match(WorkbenchConfiguration.FocusRecentEditorAfterClose)) {
            this._focusRecentEditorAfterClose = this.configurationService.get(WorkbenchConfiguration.FocusRecentEditorAfterClose);
        }

        if (!e || e.match(WorkbenchConfiguration.EditorOpenPositioning)) {
            this._editorOpenPositioning = this.configurationService.get(WorkbenchConfiguration.EditorOpenPositioning);
        }
    }
}