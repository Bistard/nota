import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { EditorViewEvent } from "src/editor/common/view";
import { IEditorViewModelEventEmitter } from "src/editor/common/viewModel";
import { EditorViewComponent } from "src/editor/view/viewComponent/viewComponent";

/**
 * @class // TODO
 */
export class EditorViewModelEventEmitter extends Disposable implements IEditorViewModelEventEmitter {

    // [fields]

    private readonly _components: Map<string, EditorViewComponent>;
    private readonly _eventsQueue: EditorViewEvent.Events[];

    // [constructor]

    constructor() {
        super();
        this._components = new Map();
        this._eventsQueue = [];
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

    // [private helper methods]

}