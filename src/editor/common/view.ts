import { Disposable } from "src/base/common/dispose";
import { IScrollEvent } from "src/base/common/scrollable";

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

    export const enum EventType {
        Focus,
        LineChanged,
        LineDeleted,
        LineInserted,
        Scroll
    };

    interface IBaseEvent {
        readonly type: EventType;
    }

    export class FocusEvent implements IBaseEvent {
        public readonly type = EventType.Focus;
        constructor(
            /**
             * If the editor is focused.
             */
            public readonly focused: boolean
        ) {}
    }

    export class LineChangedEvent implements IBaseEvent {
        public readonly type = EventType.LineChanged;
    }

    export class LineDeletedEvent implements IBaseEvent {
        public readonly type = EventType.LineDeleted;
    }

    export class LineInsertedEvent implements IBaseEvent {
        public readonly type = EventType.LineInserted;
    }

    export class ScrollEvent implements IBaseEvent {
        public readonly type = EventType.Scroll;

        /**
         * Top of the actual scrolling area.
         */
        public readonly scrollHeight: number;

        /**
         * Height of the actual scrolling area.
         */
        public readonly scrollTop: number;

        constructor(event: IScrollEvent) {
            this.scrollTop = event.scrollPosition;
            this.scrollHeight = event.scrollSize;
        }
    }

}

/**
 * An interface only for {@link EditorView}.
 */
export interface IEditorView extends Disposable {

    /**
     * @description Renders the editor view.
     * @param now If render instantly. Defaults to false.
     * @param everything If force to render every components of the editor. 
     *                   Defaults to false.
     */
    render(now?: boolean, everything?: boolean): void;

}
