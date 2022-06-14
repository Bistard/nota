import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { ViewEvent } from "src/editor/common/view";
import { IEditorViewModelEventEmitter } from "src/editor/common/viewModel";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";

/**
 * @class // TODO
 */
export class EditorViewModelEventEmitter extends Disposable implements IEditorViewModelEventEmitter {

    // [fields]

    private readonly _components: Map<string, EditorViewComponent>;
    private _eventsQueue: ViewEvent.Events[];

    private _paused: number;
    private _consuming: boolean;

    // [constructor]

    constructor() {
        super();
        this._components = new Map();
        this._eventsQueue = [];
        this._paused = 0;
        this._consuming = false;
    }

    // [public methods]

    public addViewComponent(id: string, component: EditorViewComponent): IDisposable {
        if (this._components.has(id)) {
            // logService
            return Disposable.NONE;
        }

        this._components.set(id, component);

        return toDisposable(() => {
            this._components.delete(id);
        });
    }

    public fire(event: ViewEvent.Events): void {
        this._eventsQueue.push(event);

        if (this._paused || this._consuming) {
            return;
        }
        
        this.__consumeQueue();
    }

    public pause(): void {
        this._paused++;
    }

    public resume(): void {
        if (!this._paused) {
            this.__consumeQueue();
        } else {
            this._paused--;
        }
    }

    // [private helper methods]

    private __consumeQueue(): void {
        this._consuming = true;

        if (this._eventsQueue.length > 0) {

            // in case fires the new added events durin the consumation.
            const newEventRef = this._eventsQueue;
            this._eventsQueue = [];

            for (const [id, component] of this._components) {
                component.onEvents(newEventRef);
            }

        }

        this._consuming = false;
    }
    
}