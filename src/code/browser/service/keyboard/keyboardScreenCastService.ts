import 'src/code/browser/service/keyboard/media.scss';
import { VisibilityController } from "src/base/browser/basic/visibilityController";
import { IDisposable } from "src/base/common/dispose";
import { DomUtility } from "src/base/browser/basic/dom";
import { IStandardKeyboardEvent, Keyboard } from "src/base/common/keyboard";
import { IntervalTimer } from "src/base/common/util/timer";
import { IKeyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { ILayoutService } from 'src/code/browser/service/layout/layoutService';

export const IKeyboardScreenCastService = createService<IKeyboardScreenCastService>('keyboard-screencast-service');

/**
 * An interface only for {@link KeyboardScreenCastService}.
 */
export interface IKeyboardScreenCastService extends IDisposable {

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

    // [field]

    private _active: boolean;
    private _container?: HTMLElement;
    private _tagContainer?: HTMLElement;
    private _prevEvent?: IStandardKeyboardEvent;
    private _visibilityController: VisibilityController;
    private _keydownListener?: IDisposable;
    private _timer?: IntervalTimer;

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

            this._timer = new IntervalTimer();
        }

        // events
        {
            this._keydownListener = this.keyboardService.onKeydown(event => {
                if (this.__ifAllowNewTag(event)) {
                    
                    if (this.__excessMaxTags() || Keyboard.isEventModifier(event)) {
                        this.__flushKeypress();
                    } 
                    
                    this.__appendTag(event);
                    this._prevEvent = event;
                }
                this._visibilityController.setVisibility(true);
                this.__resetTimer();
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

        this._timer?.dispose();
        this._timer = undefined;

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

        return !DomUtility.Positions.isInViewport(<HTMLElement>lastTag);
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

    private __resetTimer(ms: number = 1000): void {
        if (this._timer) {
            this._timer.set(() => this.__onTimeup(), ms);
        }
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
}