import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { DomEmitter, EventType } from "src/base/browser/basic/dom";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Event, Register } from "src/base/common/event";
import { createStandardKeyboardEvent, IStandardKeyboardEvent } from "src/base/common/keyboard";
import { ILayoutService } from "src/workbench/services/layout/layoutService";

export const IKeyboardService = createService<IKeyboardService>('keyboard-service');

export interface IKeyboardService extends IService {

    dispose(): void;

    /**
     * Fires when key down happens in the current window.
     */
    onKeydown: Register<IStandardKeyboardEvent>;

    /**
     * Fires when key up happens in the current window.
     */
    onKeyup: Register<IStandardKeyboardEvent>;

    /**
     * Fires when key press happens in the current window.
     */
    onKeypress: Register<IStandardKeyboardEvent>;
}

/**
 * @class A brower-side keyboard listener. All the key press will be converted 
 * into {@link IStandardKeyboardEvent} instead of raw {@link KeyboardEvent}.
 * 
 * The reason to convert the events is mainly due to different operating system 
 * may have different keycode with the same key pressed.
 */
export class KeyboardService implements IDisposable, IKeyboardService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly disposables: DisposableManager;

    // [event]

    public readonly onKeydown: Register<IStandardKeyboardEvent>;
    public readonly onKeyup: Register<IStandardKeyboardEvent>;
    public readonly onKeypress: Register<IStandardKeyboardEvent>;

    // [constructor]

    constructor(
        @ILayoutService layoutService: ILayoutService,
    ) {
        this.disposables = new DisposableManager();

        const onKeydown = new DomEmitter<KeyboardEvent>(layoutService.parentContainer, EventType.keydown, true);
        const onKeyup = new DomEmitter<KeyboardEvent>(layoutService.parentContainer, EventType.keyup, true);
        const onKeypress = new DomEmitter<KeyboardEvent>(layoutService.parentContainer, EventType.keypress, true);

        this.onKeydown = Event.map(onKeydown.registerListener, e => createStandardKeyboardEvent(e));
        this.onKeyup = Event.map(onKeyup.registerListener, e => createStandardKeyboardEvent(e));
        this.onKeypress = Event.map(onKeypress.registerListener, e => createStandardKeyboardEvent(e));

        this.disposables.register(onKeydown);
        this.disposables.register(onKeyup);
        this.disposables.register(onKeypress);
    }

    public dispose(): void {
        this.disposables.dispose();
    }

}
