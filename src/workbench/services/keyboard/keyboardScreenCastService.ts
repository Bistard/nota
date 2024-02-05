import 'src/workbench/services/keyboard/media.scss';
import { VisibilityController } from "src/base/browser/basic/visibilityController";
import { IDisposable } from "src/base/common/dispose";
import { DomEventHandler, DomUtility, EventType, addDisposableListener } from "src/base/browser/basic/dom";
import { IStandardKeyboardEvent, Keyboard } from "src/base/common/keyboard";
import { IKeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILayoutService } from 'src/workbench/services/layout/layoutService';
import { Scheduler } from 'src/base/common/utilities/async';
import { Time, TimeUnit } from 'src/base/common/date';

export const IKeyboardScreenCastService = createService<IKeyboardScreenCastService>('keyboard-screencast-service');

/**
 * An interface only for {@link KeyboardScreenCastService}.
 */
export interface IKeyboardScreenCastService extends IDisposable, IService {

    /**
     * @description Start listening to user's keypress.
     */
    start(): void;

    /**
     * @description Stop listening to user's keypress.
     */
    dispose(): void;
}

/**
 * @class A microservice that provides functionalities that screencasting user's
 * keyboard input.
 */
export class KeyboardScreenCastService implements IKeyboardScreenCastService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _flushDelay = new Time(TimeUnit.Seconds, 1);

    private _active: boolean;
    private _container?: HTMLElement;
    private _tagContainer?: HTMLElement;
    private _prevEvent?: IStandardKeyboardEvent;
    private _visibilityController: VisibilityController;
    private _keydownListener?: IDisposable;
    private _rippleListener?: IDisposable;
    private _flushKeyScheduler?: Scheduler<void>;

    // [constructor]

    constructor(
        @IKeyboardService private readonly keyboardService: IKeyboardService,
        @ILayoutService private readonly layoutService: ILayoutService,
    ) {
        this._visibilityController = new VisibilityController('visible', 'invisible', 'fade');
        this._active = false;
    }

    // [public methods]

    public start(): void {

        if (this._active) {
            return;
        }

        // rendering
        {
            this._container = document.createElement('div');
            this._container.className = 'keyboard-screen-cast';

            this._visibilityController.setDomNode(this._container);
            this._visibilityController.setVisibility(false);

            this._tagContainer = document.createElement('div');
            this._tagContainer.className = 'container';

            this._container.appendChild(this._tagContainer);
            this.layoutService.parentContainer.appendChild(this._container);

            this._flushKeyScheduler = new Scheduler(this._flushDelay, () => this.__onTimeup());
        }

        // events
        {
            // keydown
            this._keydownListener = this.keyboardService.onKeydown(event => {
                if (this.__ifAllowNewTag(event)) {

                    if (this.__excessMaxTags() || Keyboard.isEventModifier(event)) {
                        this.__flushKeypress();
                    }

                    this.__appendTag(event);
                    this._prevEvent = event;
                }
                this._visibilityController.setVisibility(true);
                this._flushKeyScheduler?.schedule();
            });

            // mouseclick
            this._rippleListener = addDisposableListener(this.layoutService.parentContainer, EventType.click, (e) => {
                if (!DomEventHandler.isLeftClick(e)) {
                    return;
                }

                this.__createRippleEffect(e);
            });
        }

        this._active = true;
    }

    public dispose(): void {
        if (!this._active) {
            return;
        }

        if (this._container) {
            DomUtility.Modifiers.removeNodeFromParent(this._container);
            this._container.remove();
            this._container = undefined;
            this._tagContainer = undefined;
            this._visibilityController.setDomNode(undefined);
        }

        this._keydownListener?.dispose();
        this._keydownListener = undefined;

        this._rippleListener?.dispose();
        this._rippleListener = undefined;

        this._flushKeyScheduler?.dispose();
        this._flushKeyScheduler = undefined;

        this._active = false;
    }

    // [private helper methods]

    private __ifAllowNewTag(event: IStandardKeyboardEvent): boolean {

        // first tag
        if (!this._prevEvent) {
            return true;
        }

        // pressing modifier twice, but we only display modifer for once.
        if (Keyboard.sameEvent(this._prevEvent, event) && Keyboard.isEventModifier(event)) {
            return false;
        }

        return true;
    }

    private __excessMaxTags(): boolean {
        if (!this._tagContainer) {
            return true;
        }

        const lastTag = this._tagContainer.lastChild;
        if (!lastTag) {
            return false;
        }

        const rect = (<HTMLElement>lastTag).getBoundingClientRect();
        const rightSpace = window.innerWidth - rect.right;
        return rightSpace < 150;
    }

    private __appendTag(event: IStandardKeyboardEvent): void {
        if (!this._tagContainer) {
            return;
        }

        const tag = document.createElement('div');
        tag.className = 'tag';

        const span = document.createElement('span');
        span.textContent = Keyboard.eventToString(event);

        tag.appendChild(span);
        this._tagContainer.appendChild(tag);
    }

    private __onTimeup(): void {
        this.__flushKeypress();
        this._visibilityController.setVisibility(false);
    }

    private __flushKeypress(): void {
        if (this._tagContainer) {
            DomUtility.Modifiers.clearChildrenNodes(this._tagContainer);
        }
        this._prevEvent = undefined;
    }

    private __createRippleEffect(event: MouseEvent): void {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${event.clientX}px`;
        ripple.style.top = `${event.clientY}px`;

        const container = this.layoutService.parentContainer;
        container.appendChild(ripple);
        setTimeout(() => container.removeChild(ripple), 300);
    }
}