import { ISash, ISashEvent } from "src/base/browser/basic/sash/sash";
import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, createStyleInCSS, EventType, Orientation } from "src/base/browser/basic/dom";

export interface IAbstractSashController extends IDisposable {
    
    // readonly onDid
    
    /** 
     * @description Fires when the {@link EventType.mousedown} happens on 
     * {@link Sash}. 
     */
    onMouseStart(): void;
}

/**
 * @class An abstract class that controls the behaviors of {@link ISash} under 
 * the operations from the users. It contains:
 *      - {@link EventType.mousedown}
 *      - {@link EventType.mousemove}
 *      - {@link EventType.mouseup}
 */
export abstract class AbstractSashController implements IAbstractSashController {

    // [field]

    protected readonly disposables = new DisposableManager();
    protected readonly sash: ISash;

    /** The offset to the expected position (middle of the adjacent views). */
    protected readonly posOffset: number;
    /** Save the previous mouse event. */
    protected prevEvent: ISashEvent;

    // [constructor]
    
    constructor(
        sash: ISash, 
        private readonly _onDidStart: (event: ISashEvent) => void,
        private readonly _onDidMove: (event: ISashEvent) => void,
        private readonly _onDidEnd: () => void,
    ) {
        this.sash = sash;
        this.posOffset = Math.round(sash.size / 2);

        this.prevEvent = {
            currentX: 0, currentY: 0,
            deltaX: 0, deltaY: 0
        };
        
        /**
         * The CSS stylesheet is necessary when the user cursor is reaching the
         * edge of the sash range but still wish the cursor style to be 
         * consistent. This will be removed once the mouse-up event happens.
         */
        const cursorStyleDisposable = createStyleInCSS(this.sash.element);
        const cursor = (this.sash.orientation === Orientation.Vertical) ? 'ew-resize' : 'ns-resize';
        cursorStyleDisposable.style.textContent = `* { cursor: ${cursor} !important; }`;

        this.disposables.register(cursorStyleDisposable);
    }

    // [abstraction]
    
    protected abstract __onMouseMove(event: MouseEvent): void;
    protected abstract __onMouseStart(): void;
    
    protected __onMouseUp(): void {
        this.disposables.dispose();
        this._onDidEnd();
    }

    // [public methods]

    public onMouseStart(): void {
        this.__onMouseStart();

        this.disposables.register(addDisposableListener(window, EventType.mousemove, e => this.__onMouseMove(e)));
        this.disposables.register(addDisposableListener(window, EventType.mouseup, () => this.__onMouseUp()));

        this._onDidStart(this.prevEvent);
    }

    public dispose(): void {
        this.__onMouseUp();
    }

    // [private helper methods]

    protected __fireMoveEvent(currX: number, currY: number, deltaX: number, deltaY: number): void {
        const event: ISashEvent = {
            currentX: currX, 
            currentY: currY, 
            deltaX: deltaX, 
            deltaY: deltaY
        };
        this.prevEvent = event;
        this._onDidMove(event);
    }
}

export class VerticalSashController extends AbstractSashController {

    constructor(
        sash: ISash,
        _onDidStart: (event: ISashEvent) => void,
        _onDidMove: (event: ISashEvent) => void,
        _onDidEnd: () => void,
    ) {
        super(sash, _onDidStart, _onDidMove, _onDidEnd);
    }

    protected override __onMouseStart(): void {
        this.prevEvent = {
            currentX: this.sash.position,
            currentY: 0,
            deltaX: 0,
            deltaY: 0
        };
    }

    public override __onMouseMove(e: MouseEvent): void {
        
        let deltaPosition = e.movementX;
        if (deltaPosition === 0) {
            return;
        }

        const idealPosition = this.sash.position + this.posOffset;
        const offsetPosition = e.pageX - this.prevEvent.currentX;
        
        // if the sash already touches the edge of its range, we do nothing.
        if ((idealPosition === this.sash.range.start && offsetPosition < 0) || 
            (idealPosition === this.sash.range.end && offsetPosition > 0)) 
        {
            return;
        }
        
        /**
         * The sash did not touch the edges, but the delta position will reach 
         * the edges of its range.
         */
        const expectPosition = idealPosition + deltaPosition;
        if (expectPosition <= this.sash.range.start || expectPosition >= this.sash.range.end) 
        {
            this.sash.position = (deltaPosition < 0) ? this.sash.range.start : this.sash.range.end;
            this.sash.position -= this.posOffset;
            this.sash.element.style.left = `${this.sash.position}px`;
            
            deltaPosition = this.sash.position - this.prevEvent.currentX;
        }
        /** general case */
        else {
            this.sash.position += deltaPosition;
        }
        
        this.sash.element.style.left = `${this.sash.position}px`;
        this.__fireMoveEvent(this.sash.position, 0, deltaPosition, 0);
    }
}

export class HorizontalSashController extends AbstractSashController {

    constructor(
        sash: ISash,
        _onDidStart: (event: ISashEvent) => void,
        _onDidMove: (event: ISashEvent) => void,
        _onDidEnd: () => void,
    ) {
        super(sash, _onDidStart, _onDidMove, _onDidEnd);
    }

    protected override __onMouseStart(): void {
        this.prevEvent = {
            currentX: 0,
            currentY: this.sash.position,
            deltaX: 0,
            deltaY: 0
        };
    }

    public override __onMouseMove(e: MouseEvent): void {
        
        let deltaPosition = e.movementY;
        if (deltaPosition === 0) {
            return;
        }

        const idealPosition = this.sash.position + this.posOffset;
        const offsetPosition = e.pageY - this.prevEvent.currentY;

        // if the sash already touches the edge of its range, we do nothing.
        if ((idealPosition === this.sash.range.start && offsetPosition < 0) || 
            (idealPosition === this.sash.range.end && offsetPosition > 0)) 
        {
            return;
        }
        
        /**
         * The sash did not touch the edges, but the delta position will reach 
         * the edges of its range.
         */
        const expectPosition = idealPosition + deltaPosition;
        if (expectPosition <= this.sash.range.start || expectPosition >= this.sash.range.end) 
        {
            this.sash.position = (deltaPosition < 0) ? this.sash.range.start : this.sash.range.end;
            this.sash.position -= this.posOffset;
            deltaPosition = this.sash.position - this.prevEvent.currentY;
        } 
        /** general case */
        else {
            this.sash.position += deltaPosition;
        }

        this.sash.element.style.top = `${this.sash.position}px`;
        this.__fireMoveEvent(0, this.sash.position, 0, deltaPosition);
    }

}

