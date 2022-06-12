import { EditorViewEvent } from "src/editor/common/view";

/**
 * @class // TODO
 */
export abstract class EditorViewEventHandler {

    constructor() {}

    // [public methods - general]

    public onEvents(events: EditorViewEvent.Events[]): void {

        let i = 0;
        let length = events.length;
        let event: EditorViewEvent.Events;
        for (i = 0; i < length; i++) {
            event = events[i]!;
            
            switch(event.type) {

                case EditorViewEvent.EventType.Focus:
                    this.onFocusChanged(event);
                    break;
                case EditorViewEvent.EventType.LineChanged:
                    this.onLinesChanged(event);
                    break;
                case EditorViewEvent.EventType.LineDeleted:
                    this.onLinesDeleted(event);
                    break;
                case EditorViewEvent.EventType.LineInserted:
                    this.onLinesInserted(event);
                    break;
            }
        }
    }

    // [public methods - might be overrided]

    /**
     * @description Invokes when the focus of the editor is changed.
     */
    public onFocusChanged(event: EditorViewEvent.FocusEvent): void {}

    /**
     * @description Invokes when the line content is(are) changed.
     */
    public onLinesChanged(event: EditorViewEvent.LineChangedEvent): void {}

    /**
     * @description Invokes when new line(s) is inserted.
     */
    public onLinesInserted(event: EditorViewEvent.LineInsertedEvent): void {}

    /**
     * @description Invokes when existed line(s) is deleted.
     */
    public onLinesDeleted(event: EditorViewEvent.LineDeletedEvent): void {}
}