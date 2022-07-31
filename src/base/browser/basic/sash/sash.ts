import { Disposable } from "src/base/common/dispose";
import { addDisposableListener, EventType, Orientation } from "src/base/common/dom";
import { Emitter, Register } from "src/base/common/event";
import { IRange } from "src/base/common/range";

/**
 * An interface for {@link Sash} construction.
 */
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
     * The width or height of the {@link Sash} depends on the _orientation.
     */
    readonly size?: number;

    /**
     * The range (closed interval) that the {@link Sash} is allowed to move 
     * between.
     * 
     * @note If -1 provided in any interals, means no restrictions.
     */
    readonly range?: IRange;
}

/**
 * The event fires when the {@link Sash} drag-move / drag-start / drag-end.
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

/**
 * An interface only for {@link Sash}.
 */
export interface ISash {
    
    /**
     * The width / height of the sash. Default is 4.
     */
    readonly size: number;

    /**
     * The default left / top position when the sash is reset by double click.
     */
    readonly defaultPosition: number;

    /**
     * Fires when the sash dragging is started (mouse-down).
     */
    readonly onDidStart: Register<ISashEvent>;

    /**
     * Fires when the sash dragging is moved (mouse-move).
     */
    readonly onDidMove: Register<ISashEvent>;
    
    /**
     * Fires when the sash dragging is stoped (mouse-up).
     */
    readonly onDidEnd: Register<void>;
    
    /**
     * @description Relayout the default position of the {@link Sash} and sets to the given 
     * position.
     */
    relayout(position: number): void;

    /**
     * @description Registers DOM-related listeners.
     */
    registerListeners(): void;

    /**
     * @description Disposes the {@link Sash} UI component.
     */
    dispose(): void
}

/**
 * @class A {@link Sash} is a UI component that allows the user to resize other 
 * components (using events). It's usually an invisible horizontal or vertical 
 * line which, when hovered, becomes highlighted and can be dragged along the 
 * perpendicular dimension to its direction.
 */
export class Sash extends Disposable implements ISash {

    // [fields]

    /**
     * when vertical: width of the sash.
     * when horizontal: height of the sash.
     */
    public readonly size: number;

    /** 
     * when vertical: the draggable range in x of the sash.
     * when horizontal: the draggable range in y of the sash.
     */
    public readonly range: IRange | undefined;

    /* The HTMLElement of the sash, will be created by calling `this.create()`. */
    private _element!: HTMLElement;
    /* The parent HTMLElement to be append to. Will be appended by calling `this.create()`. */
    private _parentElement: HTMLElement;

    private _disposed: boolean;

    /** 
     * when vertical: the default position in x of the sash
     * when horizontal: the default position in y of the sash
     */
    private _defaultPosition: number;

    // [event]

    /** An event which fires whenever the user starts dragging this sash. */
	private readonly _onDidStart = this.__register(new Emitter<ISashEvent>());
    public readonly onDidStart: Register<ISashEvent> = this._onDidStart.registerListener;

	/** An event which fires whenever the user moves the mouse while dragging this sash. */
    private readonly _onDidMove = this.__register(new Emitter<ISashEvent>());
	public readonly onDidMove: Register<ISashEvent> = this._onDidMove.registerListener;

	/** An event which fires whenever the user stops dragging this sash. */
	private readonly _onDidEnd = this.__register(new Emitter<void>());
	public readonly onDidEnd: Register<void> = this._onDidEnd.registerListener;

    /** An event which fires whenever the user double clicks this sash. */
    private readonly _onDidReset = this.__register(new Emitter<void>());
	public readonly onDidReset: Register<void> = this._onDidReset.registerListener;

    /** 
     * {@link Orientation.Horizontal} means sash lays out horizontally.
     * {@link Orientation.vertical} means lays out vertically.
     */
    private _orientation: Orientation;

    // [constructor]

    constructor(_parentElement: HTMLElement, opts: ISashOpts) {
        super();

        this._parentElement = _parentElement;
        this._disposed = false;

        // Options
        this._orientation = opts.orientation;
        this._defaultPosition = opts.defaultPosition ?? 0;
        this.size = opts.size ? opts.size : 4;
        if (opts.range) {
            this.range = opts.range;
        }

        this.__render();
    }

    // [getter / setter]

    get defaultPosition(): number {
        return this._defaultPosition;
    }

    // [public methods]

    public override dispose(): void {
        if (this._disposed === false) {
            super.dispose();
            this._element.remove();
            this._disposed = true;
        }
    }

    public relayout(defaultPosition: number): void {
        if (!this._element || this._disposed) {
            return;
        }
        this._defaultPosition = defaultPosition;
        this._element.style.left = defaultPosition + 'px';
    }

    public registerListeners(): void {
        if (this._element === undefined) {
            return;
        }

        this.__register(addDisposableListener(this._element, EventType.mousedown, 
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

        this.__register(addDisposableListener(this._element, EventType.doubleclick,
            () => {
                // reset position
                if (this._orientation === Orientation.Vertical) {
                    this._element.style.left = this._defaultPosition + 'px';
                } else {
                    this._element.style.top = this._defaultPosition + 'px';
                }
                
                // fire event
                this._onDidReset.fire();
            }
        ));
    }

    // [private helper methods]

    /**
     * @description Renders the DOM elements of the {@link Sash} and put it into
     * the DOM tree.
     */
    private __render(): void {
        this._element = document.createElement('div');
        this._element.classList.add('sash');

        if (this._orientation === Orientation.Vertical) {
            this._element.classList.add('sash-vertical');
            this._element.style.width = `${this.size}px`;
            this._element.style.left = `${this._defaultPosition}px`;
        } else {
            this._element.classList.add('sash-horizontal');
            this._element.style.height = `${this.size}px`;
            this._element.style.top = `${this._defaultPosition}px`;
        }

        this._parentElement.append(this._element);
    }

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

        let mouseMoveCallback: (e: MouseEvent) => void;
        let mouseUpCallback = () => {
            document.documentElement.removeEventListener(EventType.mousemove, mouseMoveCallback, false);
            document.documentElement.removeEventListener(EventType.mouseup, mouseUpCallback, false);
            this._onDidEnd.fire();
        };

        // dragging horizontally
        if (this._orientation === Orientation.Vertical) {
            
            mouseMoveCallback = (e: MouseEvent) => {
                if (this.range && (e.clientX < this.range.start || (e.clientX > this.range.end && this.range.end !== -1))) {
                    return;
                }
                
                this._element.style.left = (startDimention + e.pageX - startCoordinate) + 'px';
                
                // To prevent firing the wrong onDidMove event at the first time.
                if (firstDrag === true) {
                    prevX = event.pageX;
                    prevY = event.pageY;
                    firstDrag = false;
                }

                this._onDidMove.fire({ startX: event.pageX, startY: event.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY });
                prevX = e.pageX;
                prevY = e.pageY;
            };
    
            startCoordinate = event.pageX;
            startDimention = parseInt(this._element.style.left, 10);
        } 
        // dragging vertically
        else {
            
            mouseMoveCallback = (e: MouseEvent) => {
                if (this.range && (e.clientY < this.range.start || (e.clientY > this.range.end && this.range.end !== -1))) {
                    return;
                }

                this._element.style.top = (startDimention + event.pageY - startCoordinate) + 'px';
                
                if (firstDrag === true) {
                    prevX = event.pageX;
                    prevY = event.pageY;
                    firstDrag = false;
                }

                this._onDidMove.fire({ startX: event.pageX, startY: event.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY });
                prevX = e.pageX;
                prevY = e.pageY;
            };
    
            startCoordinate = event.pageY;
            startDimention = parseInt(this._element.style.top, 10);
        }

        // listeners registration
        document.documentElement.addEventListener(EventType.mousemove, mouseMoveCallback, false);
        document.documentElement.addEventListener(EventType.mouseup, mouseUpCallback, false);
    }

}