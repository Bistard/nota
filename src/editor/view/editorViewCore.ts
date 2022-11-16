import { EditorState as ProseEditorState, Transaction } from "prosemirror-state";
import { EditorView as ProseEditorView } from "prosemirror-view";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { MarkdownSchema } from "src/editor/model/markdown/schema";

/**
 * An interface only for {@link EditorViewCore}.
 */
export interface IEditorViewCore extends Disposable {

    /**
     * Event fires before next rendering on DOM tree.
     */
    readonly onRender: Register<void>;

    /**
     * @description Focus the view.
     */
    focus(): void;

    /**
     * @description Is the view focused.
     */
    isFocused(): boolean;
    
    /**
     * @description Removes the editor from the DOM and destroys all the 
     * resources relate to editor. 
     * @note Alternatives to {@link IEditorViewCore.dispose}.
     */
    destroy(): void;

    /**
     * @description If the view is destroyed. 
     * @note Alternatives to {@link IEditorViewCore.isDisposed}.
     */
    isDestroyed(): boolean;
}

/**
 * @class Adaptation over {@link ProseEditorState}.
 */
export class EditorViewCore extends Disposable implements IEditorViewCore {

    // [field]

    private readonly _view: ProseEditorView;

    // [event]

    private readonly _onRender = this.__register(new Emitter<void>());
    public readonly onRender = this._onRender.registerListener;

    // [constructor]

    constructor(
        container: HTMLElement,
        initState?: ProseEditorState,
    ) {
        super();

        initState = initState ?? this.__createDefaultInitState();

        this._view = new ProseEditorView(
            container, 
            {
                state: initState,
                dispatchTransaction: (transaction: Transaction) => {
                    this._onRender.fire();
                    const newState = this._view.state.apply(transaction);
                    this._view.updateState(newState);
                },
            }
        );
    }

    // [public methods]

    public focus(): void {
        this._view.focus();
    }

    public isFocused(): boolean {
        return this._view.hasFocus();
    }

    public destroy(): void {
        this.dispose();
    }

    public isDestroyed(): boolean {
        return this.isDisposed();
    }

    public override dispose(): void {
        super.dispose();
        if (!this._view.isDestroyed) {
            this._view.destroy();
        }
    }

    // [private helper methods]

    private __createDefaultInitState(): ProseEditorState {
        return ProseEditorState.create({
            schema: new MarkdownSchema(),
            plugins: [],
        });
    }

}