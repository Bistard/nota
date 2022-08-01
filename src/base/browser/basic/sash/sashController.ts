import { ISash, ISashEvent } from "src/base/browser/basic/sash/sash";
import { DisposableManager } from "src/base/common/dispose";
import { addDisposableListener, EventType, IStyleDisposable } from "src/base/common/dom";

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
    
    constructor(initEvent: MouseEvent, cursorStyle: IStyleDisposable, sash: ISash) {
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

        this.disposables.register(cursorStyle);
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
        (<any>this.sash)._onDidEnd.fire(this.prevEvent);
    }
}

export class VerticalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, cursorStyle: IStyleDisposable, sash: ISash) {
        super(initEvent, cursorStyle, sash);
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
            if (this.firstDrag === true) {
                this.prevX = this.initEvent.pageX;
                this.prevY = this.initEvent.pageY;
                this.firstDrag = false;
            }
            const eventData: ISashEvent = { 
                startX: this.initEvent.pageX, 
                startY: this.initEvent.pageY, 
                currentX: this.sash.position, 
                currentY: e.pageY, 
                deltaX: this.sash.position - this.prevX, 
                deltaY: e.pageY - this.prevY 
            };
            (<any>this.sash)._onDidMove.fire(eventData);
            this.prevEvent = eventData;
            this.prevX = this.sash.position;
            this.prevY = e.pageY;
            return;
        }

        this.sash.position = this.startSashCoordinate + e.pageX - this.startClickCoordinate;
        this.sash.element.style.left = `${this.sash.position}px`;
        
        // To prevent firing the wrong onDidMove event at the first time.
        if (this.firstDrag === true) {
            this.prevX = this.initEvent.pageX;
            this.prevY = this.initEvent.pageY;
            this.firstDrag = false;
        }

        const eventData: ISashEvent = { startX: this.initEvent.pageX, startY: this.initEvent.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - this.prevX, deltaY: e.pageY - this.prevY };
        (<any>this.sash)._onDidMove.fire(eventData);

        this.prevEvent = eventData;
        this.prevX = e.pageX;
        this.prevY = e.pageY;
    }
}

export class HorizontalSashController extends AbstractSashController {

    constructor(initEvent: MouseEvent, cursorStyle: IStyleDisposable, sash: ISash) {
        super(initEvent, cursorStyle, sash);
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
            if (this.firstDrag === true) {
                this.prevX = this.initEvent.pageX;
                this.prevY = this.initEvent.pageY;
                this.firstDrag = false;
            }
            const eventData: ISashEvent = { 
                startX: this.initEvent.pageX, 
                startY: this.initEvent.pageY, 
                currentX: e.pageX, 
                currentY: this.sash.position, 
                deltaX: e.pageX - this.prevX, 
                deltaY: this.sash.position - this.prevY 
            };
            (<any>this.sash)._onDidMove.fire(eventData);
            this.prevEvent = eventData;
            this.prevX = e.pageX;
            this.prevY = this.sash.position;
            return;
        }

        this.sash.position = this.startSashCoordinate + e.pageY - this.startClickCoordinate;
        this.sash.element.style.top = `${this.sash.position}px`;
        
        // To prevent firing the wrong onDidMove event at the first time.
        if (this.firstDrag === true) {
            this.prevX = this.initEvent.pageX;
            this.prevY = this.initEvent.pageY;
            this.firstDrag = false;
        }

        const eventData: ISashEvent = { 
            startX: this.initEvent.pageX, 
            startY: this.initEvent.pageY, 
            currentX: e.pageX, 
            currentY: e.pageY, 
            deltaX: e.pageX - this.prevX, 
            deltaY: e.pageY - this.prevY 
        };
        (<any>this.sash)._onDidMove.fire(eventData);

        this.prevEvent = eventData;
        this.prevX = e.pageX;
        this.prevY = e.pageY;
    }

}

