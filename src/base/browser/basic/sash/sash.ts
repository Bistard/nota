import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType, Orientation } from "src/base/common/dom";
import { Emitter, Register } from "src/base/common/event";
import { IRange } from "src/base/common/range";
import { ICreateable } from "src/code/browser/workbench/component";

export interface ISashOpts {
    
    /**
     * Determines if a {@link Sash} is horizontal or vertical.
     */
    readonly orientation: Orientation;

    /**
     * The starting position when the {@link Sash} has been created or reset.
     * 
     * When it is vertical, it is the left-most position (x-axis).
     * When it is horizontal, it is the top-most position (y-axis).
     * @default value 0
     */
    readonly defaultPosition?: number;

    
    /**
     * The width or height of the {@link Sash} depends on the orientation.
     */
    readonly size?: number;

    /**
     * The range (closed interval) that the {@link Sash} is allowed to move between.
     * 
     * If -1 provided in any interals, means no restrictions.
     */
    readonly range?: IRange;
}

/**
 * The event fires when the {@link Sash} move / start / end.
 */
export interface ISashEvent {
    /* The start coordinate */
    readonly startX: number;
	readonly startY: number;
    
    /* The current coordinate */
    readonly currentX: number;
	readonly currentY: number;

    /* The change in coordinate */
    readonly deltaX: number;
    readonly deltaY: number;
}

export interface ISash {
    readonly size: number;
    readonly defaultPosition: number;

    readonly onDidStart: Register<ISashEvent>;
    readonly onDidMove: Register<ISashEvent>;
    readonly onDidEnd: Register<void>;
    
    /**
     * Disposes the {@link Sash} UI component.
     */
    dispose(): void;

    /**
     * Creates the DOM elements.
     */
    create(): void;

    /**
     * Relayout the default position of the {@link Sash} and sets to the given 
     * position.
     */
    relayout(position: number): void;

    /**
     * Registers DOM-related listeners.
     */
    registerListeners(): void;
}

/**
 * @class A {@link Sash} is a UI component that allows the user to resize other 
 * components (using events). It's usually an invisible horizontal or vertical 
 * line which, when hovered, becomes highlighted and can be dragged along the 
 * perpendicular dimension to its direction.
 */
export class Sash extends Disposable implements ICreateable, ISash {

    /* The HTMLElement of the sash, will be created by calling `this.create()`. */
    private element: HTMLElement | undefined;
    /* The parent HTMLElement to be append to. Will be appended by calling `this.create()`. */
    private parentElement: HTMLElement;

    private disposed: boolean = false;

    /* Options */

    // when vertical: width of the sash
    // when horizontal: height of the sash
    public readonly size: number;

    // when vertical: the default position in x of the sash
    // when horizontal: the default position in y of the sash
    public defaultPosition: number;

    // when vertical: the draggable range in x of the sash
    // when horizontal: the draggable range in y of the sash
    public readonly range: IRange | undefined;

    /* Events */

    // An event which fires whenever the user starts dragging this sash. 
	private readonly _onDidStart = this.__register(new Emitter<ISashEvent>());
    public readonly onDidStart: Register<ISashEvent> = this._onDidStart.registerListener;

	// An event which fires whenever the user moves the mouse while dragging this sash. 
    private readonly _onDidMove = this.__register(new Emitter<ISashEvent>());
	public readonly onDidMove: Register<ISashEvent> = this._onDidMove.registerListener;

	// An event which fires whenever the user stops dragging this sash. 
	private readonly _onDidEnd = this.__register(new Emitter<void>());
	public readonly onDidEnd: Register<void> = this._onDidEnd.registerListener;

    // An event which fires whenever the user double clicks this sash. 
    private readonly _onDidReset = this.__register(new Emitter<void>());
	public readonly onDidReset: Register<void> = this._onDidReset.registerListener;

    /* End */

    /** 
     * {@link Orientation.Horizontal} means sash lays out horizontally.
     * {@link Orientation.vertical} means lays out vertically.
     */
    private orientation: Orientation;

    /* Constructor */
    constructor(parentElement: HTMLElement, opts: ISashOpts) {
        super();

        this.parentElement = parentElement;

        /* Options */
        this.orientation = opts.orientation;
        this.defaultPosition = opts.defaultPosition ?? 0;

        
        this.size = opts.size ? opts.size : 4;

        if (opts.range) {
            this.range = opts.range;
        }

    }

    public override dispose(): void {
        if (this.disposed === false) {
            super.dispose();
            this.element?.remove();
            this.disposed = true;
        }
    }

    public create(): void {
        if (this.element || this.disposed) {
            return;
        }
        
        // render
        this.element = document.createElement('div');
        this.element.classList.add('sash');
        this.parentElement.append(this.element);

        if (this.orientation === Orientation.Vertical) {
            this.element.classList.add('sash-vertical');
            this.element.style.width = this.size + 'px';
            this.element.style.left = this.defaultPosition + 'px';
        } else {
            this.element.classList.add('sash-horizontal');
            this.element.style.height = this.size + 'px';
            this.element.style.top = this.defaultPosition + 'px';
        }
    }

    public relayout(defaultPosition: number): void {
        if (!this.element || this.disposed) {
            return;
        }
        this.defaultPosition = defaultPosition;
        this.element.style.left = defaultPosition + 'px';
    }

    public registerListeners(): void {
        if (this.element === undefined) {
            return;
        }

        this.__register(addDisposableListener(this.element, EventType.mousedown, 
            // using anonymous callback to avoid `this` argument ambiguous.
            (e: MouseEvent) => {
                // start dragging
                this._initDrag(e);
                
                // fire event
                this._onDidStart.fire({
                    startX: e.pageX,
                    startY: e.pageY,
                    currentX: e.pageX,
                    currentY: e.pageY,
                    deltaX: 0,
                    deltaY: 0
                });
            }
        ));

        this.__register(addDisposableListener(this.element, EventType.doubleclick,
            () => {
                // reset position
                if (this.orientation === Orientation.Vertical) {
                    this.element!.style.left = this.defaultPosition + 'px';
                } else {
                    this.element!.style.top = this.defaultPosition + 'px';
                }
                
                // fire event
                this._onDidReset.fire();
            }
        ));
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    /**
     * @description Once the {@link Sash} has been mouse-downed, function will 
     * be invoked to achieve draggable animation.
     * @param event The mouse event when the mouse-downed.
     */
    private _initDrag(event: MouseEvent): void {
        
        // The start of coordinate (x / y) when mouse-downed.
        let startCoordinate = 0;
        // The start of dimension (width or height) of the sash when mouse-downed.
        let startDimention = 0;
        // The previous coordinate (x / y) when mouse-moved.
        let firstDrag = true;
        let prevX = 0, prevY = 0;

        /**
         * @readonly Comments on implementation of using local variable callbacks.
         *  1. So that listener can be removed properly.
         *  2. So that `this` argument is referring to the {@link Sash} object 
         *     instead of the actual HTMLElement.
         */

        let doDragHelper: (e: MouseEvent) => void;
        let stopDragHelper = () => {
            document.documentElement.removeEventListener(EventType.mousemove, doDragHelper, false);
            document.documentElement.removeEventListener(EventType.mouseup, stopDragHelper, false);
            this._onDidEnd.fire();
        };

        // draging horizontally
        if (this.orientation === Orientation.Vertical) {

            doDragHelper = (e: MouseEvent) => {

                if (this.range && (e.clientX < this.range.start || (e.clientX > this.range.end && this.range.end !== -1))) {
                    return;
                }
                
                this.element!.style.left = (startDimention + e.pageX - startCoordinate) + 'px';
                
                if (firstDrag === true) {
                    prevX = e.pageX;
                    prevY = e.pageY;
                    firstDrag = false;
                }

                this._onDidMove.fire({ startX: event.pageX, startY: event.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY });
                prevX = e.pageX;
                prevY = e.pageY;
            };
    
            startCoordinate = event.pageX;
            startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).left, 10);
        } 
        // draging vertically
        else {

            doDragHelper = (e: MouseEvent) => {
                if (this.range && (e.clientY < this.range.start || (e.clientY > this.range.end && this.range.end !== -1))) {
                    return;
                }

                this.element!.style.top = (startDimention + event.pageY - startCoordinate) + 'px';
                
                if (firstDrag === true) {
                    prevX = e.pageX;
                    prevY = e.pageY;
                    firstDrag = false;
                }

                this._onDidMove.fire({ startX: event.pageX, startY: event.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY });
                prevX = e.pageX;
                prevY = e.pageY;
            };
    
            startCoordinate = event.pageY;
            startDimention = parseInt(document.defaultView!.getComputedStyle(this.element!).top, 10);
        }

        // listeners registration
        document.documentElement.addEventListener(EventType.mousemove, doDragHelper, false);
        document.documentElement.addEventListener(EventType.mouseup, stopDragHelper, false);
    }

}