import { Disposable } from "src/base/common/dispose";
import { safe } from "src/base/common/error";
import { AsyncResult, Result } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { Constructor } from "src/base/common/utilities/type";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { IEditorPaneRegistrant } from "src/workbench/services/editorPane/editorPaneRegistrant";
import { EditorPaneView, IEditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

export interface IEditorPaneCollection extends Disposable {
    readonly container: HTMLElement;
    openEditor(model: EditorPaneModel): AsyncResult<void, Error>;
}

/**
 * {@link EditorPaneCollection}
 * 
 * @description // TODO
 * 
 * Structure:
 *             (focused)             (unfocused)
 *               Tab 1                  Tab 2
 *       +==================+    +==================+
 *       |   (In the DOM)   |    |   (Not in DOM)   |
 *       |                  |    |                  |
 *       |      View 1      |    |      View 2      |
 *       |                  |    |                  |
 *       +==================+    +==================+
 */
export class EditorPaneCollection extends Disposable implements IEditorPaneCollection {

    // [fields]

    private readonly _container: HTMLElement;
    private readonly _editorPanes: IEditorPaneView[];
    private _currEditor?: IEditorPaneView | undefined; // fix: should not be undefined, use dashboard as default one.
    
    private readonly _registrant: IEditorPaneRegistrant;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IRegistrantService registrantService: IRegistrantService,
    ) {
        super();
        this._editorPanes = [];
        this._container = parent;
        this._registrant = registrantService.getRegistrant(RegistrantType.EditorPane);
    }

    // [getter]

    get container() { return this._container; }

    // [public methods]

    public openEditor(model: EditorPaneModel): AsyncResult<void, Error> {
        return Result.fromPromise(async () => {
            const { reuse, editor } = this.__getEditor(model);

            const rerender = editor.setModel(model);
            if (rerender) {
                if (!reuse) {
                    await editor.onInitialize();
                    editor.onRender(this._container);
                } else {
                    await editor.onUpdate(this._container);
                }
            }
            
            /**
             * Only start hiding and showing after every potential-error 
             * functions finished execution.
             */
            this.__hideCurrEditor();
            this.__setCurrEditor(editor);
        });
    }

    // [private helper methods]

    private __getEditor(model: EditorPaneModel): { reuse: boolean, editor: IEditorPaneView } {
        const { ctor } = this._registrant.getMatchEditor(model) ?? {};
        
        /**
         * Case 1: Cannot find any registered matched panes that can handle this 
         * model properly, we treat as unexpected error.
         */
        if (!ctor) {
            panic(`[Workspace] Cannot open editor with given editor pane model: ${model.getInfoString()}`);
        }

        /**
         * Case 2: The current editor is capable of opening the new model, we 
         * will open it in the current editor.
         */
        if (this._currEditor && this._currEditor instanceof ctor) {
            return { reuse: true, editor: this._currEditor };
        }

        /**
         * Case 3: Construct the matched one for the first time.
         */
        const editor = this.__findOrCreateEditor(model, ctor);
        return { reuse: false, editor: editor };
    }

    private __findOrCreateEditor(model: EditorPaneModel, ctor: Constructor<EditorPaneView<EditorPaneModel>>): IEditorPaneView {
        // reuse
        const existingPane = this._editorPanes.find(each => each instanceof ctor && each.onModel(model));
        if (existingPane) {
            return existingPane;
        }

        // construct new one
        const newEditor = this.instantiationService.createInstance(ctor, ...[]);
        this._editorPanes.push(newEditor);

        return newEditor;
    }

    private __hideCurrEditor(): void {
        safe(() => this._currEditor?.onVisibility(false));
        this._currEditor?.container?.remove();
    }

    private __setCurrEditor(editor: IEditorPaneView): void {
        this._currEditor = editor;
        safe(() => this._currEditor?.onVisibility(true));
        if (this._currEditor?.container) {
            this._container.appendChild(this._currEditor.container);
        }
    }
}
