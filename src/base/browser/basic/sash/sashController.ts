import { ISash, ISashEvent } from "src/base/browser/basic/sash/sash";
import { DisposableManager } from "src/base/common/dispose";
import { addDisposableListener, createStyleInCSS, EventType, IStyleDisposable, Orientation } from "src/base/common/dom";

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
    protected firstDrag = true;
    protected prevX = 0;
    protected prevY = 0;

    // The start of coordinate (x / y) of click when mouse-downed.
    protected startClickCoordinate = 0;
    // The start of coordinate (left / top) of the sash when mouse-downed.
    protected startSashCoordinate = 0;

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
        this.sash.position = this.startSashCoordinate;
        (<any>this.sash)._onDidStart.fire(this.prevEvent);
    }

    public onMouseUp(): void {
        this.disposables.dispose();
        (<any>this.sash)._onDidEnd.fire();
    }

    // [private helper methods]

    protected __firstDragCheck(): void {
        if (this.firstDrag === true) {
            this.prevX = this.initEvent.pageX;
            this.prevY = this.initEvent.pageY;
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

    protected __updatePrevData(prevEvent: ISashEvent, prevX: number, prevY: number): void {
        this.prevEvent = prevEvent;
        this.prevX = prevX;
        this.prevY = prevY;
    }
}

export class VerticalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, sash: ISash) {
        super(initEvent, sash);
    }

    protected __onMouseStart(): void {
        this.startClickCoordinate = this.initEvent.pageX;
        this.startSashCoordinate = parseInt(this.sash.element.style.left, 10);
    }

    public onMouseMove(e: MouseEvent): void {
        // Mouse exceeds the edge and the sash position reaches the edge.
        if ((e.clientX < this.sash.range.start && this.sash.range.start !== -1 && this.sash.position === this.sash.range.start) || 
            (e.clientX > this.sash.range.end && this.sash.range.end !== -1 && this.sash.position === this.sash.range.end)
        ) {
            return;
        }

        // Mouse exceeds the edge but the sash position does not reach yet.
        if ((e.clientX < this.sash.range.start) || (e.clientX > this.sash.range.end)) {
            this.sash.position = (e.clientX < this.sash.range.start) ? this.sash.range.start : this.sash.range.end;
            this.sash.element.style.left = `${this.sash.position}px`;
            
            this.__firstDragCheck();
            const event = this.__fireMoveEvent(this.sash.position, e.pageY, this.sash.position - this.prevX, e.pageY - this.prevY);
            this.__updatePrevData(event, this.sash.position, e.pageY);
            return;
        }

        this.sash.position = this.startSashCoordinate + e.pageX - this.startClickCoordinate;
        this.sash.element.style.left = `${this.sash.position}px`;
        
        this.__firstDragCheck();
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevX, e.pageY - this.prevY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }
}

export class HorizontalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, sash: ISash) {
        super(initEvent, sash);
    }

    protected __onMouseStart(): void {
        this.startClickCoordinate = this.initEvent.pageY;
        this.startSashCoordinate = parseInt(this.sash.element.style.top, 10);
    }

    public onMouseMove(e: MouseEvent): void {
        // Mouse exceeds the edge and the sash position reaches the edge.
        if ((e.clientY < this.sash.range.start && this.sash.range.start !== -1 && this.sash.position === this.sash.range.start) || 
            (e.clientY > this.sash.range.end && this.sash.range.end !== -1 && this.sash.position === this.sash.range.end)
        ) {
            return;
        }

        // Mouse exceeds the edge but the sash position does not reach yet.
        if ((e.clientY < this.sash.range.start) || (e.clientY > this.sash.range.end)) {
            this.sash.position = (e.clientY < this.sash.range.start) ? this.sash.range.start : this.sash.range.end;
            this.sash.element.style.top = `${this.sash.position}px`;
            
            this.__firstDragCheck();
            const event = this.__fireMoveEvent(e.pageX, this.sash.position, e.pageX - this.prevX, this.sash.position - this.prevY);
            this.__updatePrevData(event, e.pageX, this.sash.position);
            return;
        }

        this.sash.position = this.startSashCoordinate + e.pageY - this.startClickCoordinate;
        this.sash.element.style.top = `${this.sash.position}px`;
        
        this.__firstDragCheck();
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevX, e.pageY - this.prevY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }

}

