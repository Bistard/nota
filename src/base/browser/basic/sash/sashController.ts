import { ISash, ISashEvent } from "src/base/browser/basic/sash/sash";
import { DisposableManager } from "src/base/common/dispose";
import { addDisposableListener, createStyleInCSS, EventType, Orientation } from "src/base/common/dom";

/**
 * @class A wrapper class that controls the behaviour of {@link ISash} movements 
 * that relate to mouse manipulations.
 */
export abstract class AbstractSashController {

    // [field]

    protected readonly disposables = new DisposableManager();
    protected readonly sash: ISash;
    protected readonly initEvent: MouseEvent;
    protected prevEvent: ISashEvent;
    protected prevPosX = 0;
    protected prevPosY = 0;
    protected firstDrag = true;

    // The start of position (x / y) of click when mouse-downed.
    protected startClickPos = 0;
    // The start of position (left / top) of the sash when mouse-downed.
    protected startSashPos = 0;

    // [constructor]
    
    constructor(initEvent: MouseEvent, sash: ISash) {
        this.sash = sash;
        this.initEvent = initEvent;
        this.prevEvent = {
            startX: initEvent.pageX,
            startY: initEvent.pageY,
            currentX: initEvent.pageX,
            currentY: initEvent.pageY,
            deltaX: 0,
            deltaY: 0
        };

        /**
         * The CSS stylesheet is neccessary when the user cursor is reaching the
         * edge of the sash range but still wish the cursor style to be 
         * consistent. Will be removed once the mouse-up event happens.
         */
        const cursorStyleDisposable = createStyleInCSS(this.sash.element);
        const cursor = (this.sash.orientation === Orientation.Vertical) ? 'ew-resize' : 'ns-resize';
        cursorStyleDisposable.style.textContent = `* { cursor: ${cursor} !important; }`;

        this.disposables.register(cursorStyleDisposable);
    }

    // [abstract methods]

    protected abstract __onMouseStart(): void;
    public abstract onMouseMove(event: MouseEvent): void;

    // [public methods]

    public onMouseStart(): void {
        this.__onMouseStart();
        
        this.disposables.register(addDisposableListener(window, EventType.mousemove, e => this.onMouseMove(e)));
        this.disposables.register(addDisposableListener(window, EventType.mouseup, () => this.onMouseUp()));
        this.sash.position = this.startSashPos;
        (<any>this.sash)._onDidStart.fire(this.prevEvent);
    }

    public onMouseUp(): void {
        this.disposables.dispose();
        (<any>this.sash)._onDidEnd.fire();
    }

    // [private helper methods]

    protected __firstDragCheck(): void {
        if (this.firstDrag === true) {
            this.prevPosX = this.initEvent.pageX;
            this.prevPosY = this.initEvent.pageY;
            this.firstDrag = false;
        }
    }

    protected __fireMoveEvent(currX: number, currY: number, deltaX: number, deltaY: number): ISashEvent {
        const event: ISashEvent = {
            startX: this.initEvent.pageX, 
            startY: this.initEvent.pageY, 
            currentX: currX, 
            currentY: currY, 
            deltaX: deltaX, 
            deltaY: deltaY
        };
        (<any>this.sash)._onDidMove.fire(event);
        return event;
    }

    protected __updatePrevData(prevEvent: ISashEvent, prevPosX: number, prevPosY: number): void {
        this.prevEvent = prevEvent;
        this.prevPosX = prevPosX;
        this.prevPosY = prevPosY;
    }
}

export class VerticalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, sash: ISash) {
        super(initEvent, sash);
    }

    protected __onMouseStart(): void {
        this.startClickPos = this.initEvent.pageX;
        this.startSashPos = parseInt(this.sash.element.style.left, 10);
    }

    public onMouseMove(e: MouseEvent): void {
        const reachMin = e.clientX < this.sash.range.start;
        const reachMax = e.clientX > this.sash.range.end;
        
        // Mouse exceeds the edge and the sash position reaches the edge.
        if ((reachMin && this.sash.range.start !== -1 && this.sash.position === this.sash.range.start) || 
            (reachMax && this.sash.range.end !== -1 && this.sash.position === this.sash.range.end)
        ) {
            return;
        }

        // Mouse exceeds the edge but the sash position does not reach yet.
        if (reachMin || reachMax) {
            this.sash.position = (reachMin) ? this.sash.range.start : this.sash.range.end;
            this.sash.element.style.left = `${this.sash.position}px`;
            
            this.__firstDragCheck();
            const event = this.__fireMoveEvent(this.sash.position, e.pageY, this.sash.position - this.prevPosX, e.pageY - this.prevPosY);
            this.__updatePrevData(event, this.sash.position, e.pageY);
            return;
        }

        this.sash.position = this.startSashPos + e.pageX - this.startClickPos;
        this.sash.element.style.left = `${this.sash.position}px`;
        
        this.__firstDragCheck();
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevPosX, e.pageY - this.prevPosY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }
}

export class HorizontalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, sash: ISash) {
        super(initEvent, sash);
    }

    protected __onMouseStart(): void {
        this.startClickPos = this.initEvent.pageY;
        this.startSashPos = parseInt(this.sash.element.style.top, 10);
    }

    public onMouseMove(e: MouseEvent): void {
        const reachMin = e.clientY < this.sash.range.start;
        const reachMax = e.clientY > this.sash.range.end;

        // Mouse exceeds the edge and the sash position reaches the edge.
        if ((reachMin && this.sash.range.start !== -1 && this.sash.position === this.sash.range.start) || 
            (reachMax && this.sash.range.end !== -1 && this.sash.position === this.sash.range.end)
        ) {
            return;
        }

        // Mouse exceeds the edge but the sash position does not reach yet.
        if (reachMin || reachMax) {
            this.sash.position = (reachMin) ? this.sash.range.start : this.sash.range.end;
            this.sash.element.style.top = `${this.sash.position}px`;
            
            this.__firstDragCheck();
            const event = this.__fireMoveEvent(e.pageX, this.sash.position, e.pageX - this.prevPosX, this.sash.position - this.prevPosY);
            this.__updatePrevData(event, e.pageX, this.sash.position);
            return;
        }

        this.sash.position = this.startSashPos + e.pageY - this.startClickPos;
        this.sash.element.style.top = `${this.sash.position}px`;
        
        this.__firstDragCheck();
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevPosX, e.pageY - this.prevPosY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }

}

