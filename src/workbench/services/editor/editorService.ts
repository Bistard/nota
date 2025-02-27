import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { IEditorWidget } from "src/editor/editorWidget";
import { IEditorHostService } from "src/workbench/services/editor/editor";

export class EditorService extends Disposable implements IEditorHostService {

    declare _serviceMarker: undefined;

    // [event]

    private readonly _onCreateEditor = this.__register(new Emitter<void>());
    public readonly onCreateEditor = this._onCreateEditor.registerListener;

    private readonly _onDidCreateEditor = this.__register(new Emitter<IEditorWidget>());
    public readonly onDidCreateEditor = this._onDidCreateEditor.registerListener;

    private readonly _onCloseEditor = this.__register(new Emitter<IEditorWidget>());
    public readonly onCloseEditor = this._onCloseEditor.registerListener;

    private readonly _onDidCloseEditor = this.__register(new Emitter<void>());
    public readonly onDidCloseEditor = this._onDidCloseEditor.registerListener;

    private readonly _onDidFocusedEditorChange = this.__register(new Emitter<IEditorWidget | undefined>());
    public readonly onDidFocusedEditorChange = this._onDidFocusedEditorChange.registerListener;

    // [field]

    private readonly _editors: Map<string, IEditorWidget>;
    private _focusedEditor: IEditorWidget | undefined;

    // [constructor]

    constructor() {
        super();
        this._editors = new Map();
        this._focusedEditor = undefined;
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
        this._editors.clear();
    }

    public onCreate(): void {
        this._onCreateEditor.fire();
    }

    public create(editor: IEditorWidget): void {
        this._editors.set(editor.getID(), editor);
        this._onDidCreateEditor.fire(editor);
    }

    public onClose(editor: IEditorWidget): void {
        this._editors.delete(editor.getID());
        this._onCloseEditor.fire(editor);
    }

    public close(): void {
        this._onDidCloseEditor.fire();
    }

    public focus(editor: IEditorWidget): void {
        this._focusedEditor = editor;
        this._onDidFocusedEditorChange.fire(editor);
    }

    public blur(editor: IEditorWidget): void {
        this._focusedEditor = undefined;
        this._onDidFocusedEditorChange.fire(undefined);
    }

    public getFocusedEditor(): IEditorWidget | undefined {
        return this._focusedEditor;
    }

    public getEditors(): readonly IEditorWidget[] {
        return [...this._editors.values()];
    }

    // [private methods]

}