import { VisibilityController } from "src/base/browser/basic/visibilityController";
import { IDisposable } from "src/base/common/dispose";
import { DomUtility } from "src/base/common/dom";
import { IStandardKeyboardEvent, Keyboard } from "src/base/common/keyboard";
import { IntervalTimer } from "src/base/common/util/timer";
import { IKeyboardService } from "src/code/browser/service/keyboardService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IKeyboardScreenCastService = createDecorator<IKeyboardScreenCastService>('keyboard-screencast-service');

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

    public static readonly MAX_CHILDREN = 14;

    private _active: boolean = false;
    
    private _container?: HTMLElement;
    private _tagContainer?: HTMLElement;
    
    private _childrenCount: number;
    private _prevEvent?: IStandardKeyboardEvent;

    private _visibilityController: VisibilityController;

    private _keydownListener?: IDisposable;
    private _timer?: IntervalTimer;

    // [constructor]
    
    constructor(
        @IKeyboardService private keyboardService: IKeyboardService,
    ) {
        this._visibilityController = new VisibilityController('visible', 'invisible', 'fade');
        this._childrenCount = 0;
    }

    // [public methods]

    public start(): void {
        
        if (this._active) {
            return;
        }
        
        this._container = document.createElement('div');
        this._container.className = 'keyboard-screen-cast';
        this._visibilityController.setDomNode(this._container);
        this._visibilityController.setVisibility(false);

        this._tagContainer = document.createElement('div');
        this._tagContainer.className = 'container';

        this._container.appendChild(this._tagContainer);
        document.body.appendChild(this._container);

        this._keydownListener = this.keyboardService.onKeydown(event => {
            if (this.__ifAllowNewTag(event)) {
                
                if (this._childrenCount > KeyboardScreenCastService.MAX_CHILDREN) {
                    this.__flushKeypress();
                } 
                
                else if (Keyboard.isEventModifier(event)) {
                    this.__flushKeypress();
                }
                
                this.__appendTag(event);
                this._prevEvent = event;
            }
            this._visibilityController.setVisibility(true);
            this.__resetTimer();
        });

        this._timer = new IntervalTimer();
        this._childrenCount = 0;
        
        this._active = true;
    }

    public dispose(): void {
        if (this._active === false) {
            return;
        }

        if (this._container) {
            DomUtility.removeNodeFromParent(this._container);
            this._container.remove();
            this._container = undefined;
            this._tagContainer = undefined;
            this._visibilityController.setDomNode(undefined as unknown as any);
        }
        
        if (this._keydownListener) {
            this._keydownListener.dispose();
            this._keydownListener = undefined;
        }

        if (this._timer) {
            this._timer.dispose();
            this._timer = undefined;
        }

        this._childrenCount = 0;
        this._active = false;
    }

    // [private helper methods]

    private __ifAllowNewTag(event: IStandardKeyboardEvent): boolean {

        // first tag
        if (!this._prevEvent) {
            return true;
        }

        // pressing modifier twice, but we only display modifer for once
        if (Keyboard.sameEvent(this._prevEvent, event) && Keyboard.isEventModifier(event)) {
            return false;
        }
        
        return true;
    }

    private __appendTag(event: IStandardKeyboardEvent): void {
        
        const tag = document.createElement('div');
        tag.className = 'tag';
    
        const span = document.createElement('span');
        span.textContent = Keyboard.eventToString(event);
        
        tag.appendChild(span);
        this._tagContainer!.appendChild(tag);

        this._childrenCount++;
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
            DomUtility.clearChildrenNodes(this._tagContainer);
        }
        this._prevEvent = undefined;
        this._childrenCount = 0;
    }

}