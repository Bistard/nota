import { Disposable, IDisposable } from "src/base/common/dispose";
import { DomEmitter, EventType } from "src/base/browser/basic/dom";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { Event, Register } from "src/base/common/event";
import { createStandardKeyboardEvent, IStandardKeyboardEvent } from "src/base/common/keyboard";
import { ILayoutService } from "src/workbench/services/layout/layoutService";

export const IKeyboardService = createService<IKeyboardService>('keyboard-service');

/**
 * An interface only for {@link KeyboardService}.
 */
export interface IKeyboardService extends IService, IDisposable {

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
    
    /**
     * Event fired when a text composition (e.g., IME input) starts in the 
     * current window. Typically used to handle non-Latin character inputs.
     */
    onCompositionStart: Register<CompositionEvent>;
    
    /**
     * Event fired when a text composition is updated in the current window.
     * Updates occur as the composition progresses, such as when modifying 
     * characters.
     */
    onCompositionUpdate: Register<CompositionEvent>;
    
    /**
     * Event fired when a text composition ends in the current window.
     * Indicates that the composed text is finalized and inserted.
     */
    onCompositionEnd: Register<CompositionEvent>;
}

/**
 * @class A browser-side keyboard listener. All the key press will be converted 
 * into {@link IStandardKeyboardEvent} instead of raw {@link KeyboardEvent}.
 * 
 * The reason to convert the events is mainly due to different operating system 
 * may have different keycode with the same key pressed.
 */
export class KeyboardService extends Disposable implements IKeyboardService {

    declare _serviceMarker: undefined;

    // [event]

    public readonly onKeydown: Register<IStandardKeyboardEvent>;
    public readonly onKeyup: Register<IStandardKeyboardEvent>;
    public readonly onKeypress: Register<IStandardKeyboardEvent>;
    public readonly onCompositionStart: Register<CompositionEvent>;
    public readonly onCompositionUpdate: Register<CompositionEvent>;
    public readonly onCompositionEnd: Register<CompositionEvent>;

    // [constructor]

    constructor(
        @ILayoutService layoutService: ILayoutService,
    ) {
        super();
        const onKeydown = this.__register(new DomEmitter(layoutService.parentContainer, EventType.keydown, true));
        const onKeyup = this.__register(new DomEmitter(layoutService.parentContainer, EventType.keyup, true));
        const onKeypress = this.__register(new DomEmitter(layoutService.parentContainer, EventType.keypress, true));
        const onCompositionStart = this.__register(new DomEmitter(layoutService.parentContainer, EventType.compositionStart, true));
        const onCompositionUpdate = this.__register(new DomEmitter(layoutService.parentContainer, EventType.compositionUpdate, true));
        const onCompositionEnd = this.__register(new DomEmitter(layoutService.parentContainer, EventType.compositionEnd, true));

        this.onKeydown = Event.map(onKeydown.registerListener, e => createStandardKeyboardEvent(e));
        this.onKeyup = Event.map(onKeyup.registerListener, e => createStandardKeyboardEvent(e));
        this.onKeypress = Event.map(onKeypress.registerListener, e => createStandardKeyboardEvent(e));
        this.onCompositionStart = onCompositionStart.registerListener;
        this.onCompositionUpdate = onCompositionUpdate.registerListener;
        this.onCompositionEnd = onCompositionEnd.registerListener;
    }
}
