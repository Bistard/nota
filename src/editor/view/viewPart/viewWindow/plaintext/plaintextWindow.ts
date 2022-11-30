// import { Disposable } from "src/base/common/dispose";
// import { Register } from "src/base/common/event";
// import { ProseEditorState } from "src/editor/common/proseMirror";
// import { IRenderPlainEvent } from "src/editor/common/viewModel";
// import { ViewContext } from "src/editor/view/editorView";
// import { IWindowCore, ViewWindow } from "src/editor/view/viewPart/viewWindow/window";

// export class PlaintextWindow extends ViewWindow {

//     // [field]

//     private readonly _window: EditorViewCore;

//     // [event]

//     public readonly onRender: Register<void>;

//     // [constructor]

//     constructor(container: HTMLElement, context: ViewContext, initState?: ProseEditorState) {
//         super(container, context);

//         this._window = new EditorViewCore(container, context, initState);
        
//         this.onRender = this._window.onRender;
//     }

//     // [getter]

//     get state(): ProseEditorState {
//         return this._window.state;
//     }

//     // [public methods]

//     public updateContent(event: IRenderPlainEvent): void {
//         const plainText = event.plainText;



//         this._window.updateContent();
//     }

//     public isEditable(): boolean {
//         return this._window.isEditable();
//     }

//     public destroy(): void {
//         this._window.destroy();
//     }

//     public isDestroyed(): boolean {
//         return this._window.isDestroyed();
//     }

//     public isFocused(): boolean {
//         return this._window.isFocused();
//     }

//     public focus(): void {
//         this._window.focus();
//     }
// }

// /**
//  * An interface only for {@link PlaintextWindowCore}.
//  */
// interface IRichtextWindowCore extends IWindowCore {

// }

// /**
//  * @class Adaptation over {@link ProseEditorView}.
//  */
// class PlaintextWindowCore extends Disposable implements IRichtextWindowCore {
    
// }