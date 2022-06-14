import { ViewEvent } from "src/editor/common/view";

/**
 * @class // TODO
 */
export abstract class EditorViewEventHandler {

    constructor() {}

    // [public methods - general]

    public onEvents(events: ViewEvent.Events[]): void {

        let i = 0;
        let length = events.length;
        let event: ViewEvent.Events;
        for (i = 0; i < length; i++) {
            event = events[i]!;

            switch(event.type) {

                case ViewEvent.EventType.Focus:
                    this.onFocusChanged(event);
                    break;
                case ViewEvent.EventType.LineChanged:
                    this.onLinesChanged(event);
                    break;
                case ViewEvent.EventType.LineDeleted:
                    this.onLinesDeleted(event);
                    break;
                case ViewEvent.EventType.LineInserted:
                    this.onLinesInserted(event);
                    break;
            }
        }
    }

    // [public methods - might be overrided]

    /**
     * @description Invokes when the focus of the editor is changed.
     */
    public onFocusChanged(event: ViewEvent.FocusEvent): boolean { return false; }

    /**
     * @description Invokes when the line content is(are) changed.
     */
    public onLinesChanged(event: ViewEvent.LineChangedEvent): boolean { return false; }

    /**
     * @description Invokes when new line(s) is inserted.
     */
    public onLinesInserted(event: ViewEvent.LineInsertedEvent): boolean { return false; }

    /**
     * @description Invokes when existed line(s) is deleted.
     */
    public onLinesDeleted(event: ViewEvent.LineDeletedEvent): boolean { return false; }
}