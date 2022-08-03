import { ISash, ISashEvent } from "src/base/browser/basic/sash/sash";
import { DisposableManager } from "src/base/common/dispose";
import { addDisposableListener, createStyleInCSS, EventType, Orientation } from "src/base/common/dom";

export interface IAbstractSashController {
    /** 
     * Fires when the {@link EventType.mousedown} happens. 
     */
    onMouseStart(event: MouseEvent): void;

    /** 
     * Fires when the {@link EventType.mousemove} happens. 
     */
    onMouseMove(event: MouseEvent): void;

    /** 
     * Fires when the {@link EventType.mouseup} happens. 
     */
    onMouseUp(): void;
}

/**
 * @class An abstract class that controls the behaviours of {@link ISash} under 
 * the operations from the users. It contains:
 *      - {@link EventType.mousedown}
 *      - {@link EventType.mousemove}
 *      - {@link EventType.mouseup}
 */
export abstract class AbstractSashController implements IAbstractSashController {

    // [field]

    protected readonly disposables = new DisposableManager();
    protected readonly sash: ISash;

    /** The offset to the expected position (middle of the adjcent views). */
    protected readonly posOffset: number;
    /** The initial mouse event of the operation when mouse-start. */
    protected initEvent!: MouseEvent; // TODO: remove later
    /** Save the previous mouse event. */
    protected prevEvent!: ISashEvent;
    protected prevPosX = 0; // TODO: remove later
    protected prevPosY = 0; // TODO: remove later

    /** The start of position (x / y) of the operation when mouse-downed. */
    protected startClickPos = 0;
    /** The start of position (left / top) of the sash when mouse-downed. */
    protected startSashPos = 0;

    // [constructor]
    
    constructor(sash: ISash) {
        this.sash = sash;
        this.posOffset = Math.round(sash.size / 2);
        
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

    // [public methods]

    public abstract onMouseMove(event: MouseEvent): void;

    public onMouseStart(event: MouseEvent): void {
        this.initEvent = event;
        this.startSashPos = this.sash.position;

        this.__onMouseStart();

        this.disposables.register(addDisposableListener(window, EventType.mousemove, e => this.onMouseMove(e)));
        this.disposables.register(addDisposableListener(window, EventType.mouseup, () => this.onMouseUp()));
        (<any>this.sash)._onDidStart.fire(this.prevEvent);
    }

    public onMouseUp(): void {
        this.disposables.dispose();
        (<any>this.sash)._onDidEnd.fire();
    }

    // [private helper methods]

    protected abstract __onMouseStart(): void;

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

    protected __updatePrevData(newEvent: ISashEvent, newPosX: number, newPosY: number): void {
        this.prevEvent = newEvent;
        this.prevPosX = newPosX;
        this.prevPosY = newPosY;
    }
}

export class VerticalSashController extends AbstractSashController {

    constructor(sash: ISash) {
        super(sash);
    }

    protected override __onMouseStart(): void {
        this.prevEvent = {
            startX: this.sash.position,
            startY: this.initEvent.pageY,
            currentX: this.sash.position,
            currentY: this.initEvent.pageY,
            deltaX: 0,
            deltaY: 0
        };

        this.prevPosX = this.sash.position;
        this.prevPosY = this.initEvent.pageY;
        this.startClickPos = this.initEvent.pageX;
    }

    public override onMouseMove(e: MouseEvent): void {
        
        const deltaPosition = e.pageX - this.prevEvent.currentX;
        if (deltaPosition === 0) {
            return;
        }

        const idealPosition = this.sash.position + this.posOffset;
        
        // if the sash already touches the edge of its range, we do nothing.
        if ((idealPosition === this.sash.range.start && deltaPosition < 0) || 
            (idealPosition === this.sash.range.end && deltaPosition > 0)
        ) {
            return;
        }
        
        /**
         * The sash did not touch the edges, but the delta position will reach 
         * the edges of its range.
         */
        const expectPosition = idealPosition + deltaPosition;
        if (expectPosition <= this.sash.range.start || 
            expectPosition >= this.sash.range.end
        ) {
            this.sash.position = (deltaPosition < 0) ? this.sash.range.start : this.sash.range.end;
            this.sash.position -= this.posOffset;
            this.sash.element.style.left = `${this.sash.position}px`;
            
            const event = this.__fireMoveEvent(this.sash.position, e.pageY, this.sash.position - this.prevPosX, e.pageY - this.prevPosY);
            this.__updatePrevData(event, this.sash.position, e.pageY);
            return;
        }
        
        // general case
        this.sash.position += deltaPosition;
        this.sash.element.style.left = `${this.sash.position}px`;
        
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevPosX, e.pageY - this.prevPosY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }
}

export class HorizontalSashController extends AbstractSashController {

    constructor(sash: ISash) {
        super(sash);
    }

    protected override __onMouseStart(): void {
        this.prevEvent = {
            startX: this.initEvent.pageX,
            startY: this.sash.position,
            currentX: this.initEvent.pageX,
            currentY: this.sash.position,
            deltaX: 0,
            deltaY: 0
        };

        this.prevPosX = this.initEvent.pageX;
        this.prevPosY = this.sash.position;
        this.startClickPos = this.initEvent.pageY;
    }

    public override onMouseMove(e: MouseEvent): void {
        
        const deltaPosition = e.pageY - this.prevEvent.currentY;
        if (deltaPosition === 0) {
            return;
        }

        const idealPosition = this.sash.position + this.posOffset;
        
        // if the sash already touches the edge of its range, we do nothing.
        if ((idealPosition === this.sash.range.start && deltaPosition < 0) || 
            (idealPosition === this.sash.range.end && deltaPosition > 0)
        ) {
            return;
        }
        
        /**
         * The sash did not touch the edges, but the delta position will reach 
         * the edges of its range.
         */
        const expectPosition = idealPosition + deltaPosition;
        if (expectPosition <= this.sash.range.start || 
            expectPosition >= this.sash.range.end
        ) {
            this.sash.position = (deltaPosition < 0) ? this.sash.range.start : this.sash.range.end;
            this.sash.position -= this.posOffset;
            this.sash.element.style.top = `${this.sash.position}px`;
            
            const event = this.__fireMoveEvent(e.pageX, this.sash.position, e.pageX - this.prevPosX, this.sash.position - this.prevPosY);
            this.__updatePrevData(event, e.pageX, this.sash.position);
            return;
        }

        // general case
        this.sash.position += deltaPosition;
        this.sash.element.style.top = `${this.sash.position}px`;
        
        const event = this.__fireMoveEvent(e.pageX, e.pageY, e.pageX - this.prevPosX, e.pageY - this.prevPosY);
        this.__updatePrevData(event, e.pageX, e.pageY);
    }

}

