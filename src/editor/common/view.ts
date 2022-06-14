import { Disposable } from "src/base/common/dispose";

/**
 * Events fired by the {@link IEditorViewModel} and {@link IEditorView}.
 */
export namespace ViewEvent {

    export type Events = (
        FocusEvent |
        LineChangedEvent |
        LineDeletedEvent |
        LineInsertedEvent |
        ScrollEvent
    );

    export class FocusEvent {
        constructor(
            /**
             * If the editor is focused.
             */
            public readonly focused: boolean
        ) {}
    }
    
    export class LineChangedEvent {
    }
    
    export class LineDeletedEvent {
    }
    
    export class LineInsertedEvent {
    }
    
    export class ScrollEvent {
    }
    
}

/**
 * An interface only for {@link EditorView}.
 */
export interface IEditorView extends Disposable {

    layout(): void;

}
