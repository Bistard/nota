import { Disposable, DisposableManager } from "src/base/common/dispose";
import { addDisposableListener, createStyleInCSS, EventType, Orientation } from "src/base/common/dom";
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
     * @default range { start: -1, end: -1 }.
     */
    readonly range?: IRange;
}

/**
 * The event fires when the {@link Sash} drag-move / drag-start / drag-end.
 */
export interface ISashEvent {
    /**
     * The initial coordinate in x when mouse-down.
     */
    readonly startX: number;

    /**
     * The initial coordinate in y when mouse-down.
     */
	readonly startY: number;
    
    /**
     * The current coordinate in x when mouse-move.
     */
    readonly currentX: number;

    /**
     * The current coordinate in y when mouse-move.
     */
	readonly currentY: number;

    /**
     * The delta coordinate change in x during mouse-move compares with the previous mouse-move.
     */
    readonly deltaX: number;
    
    /**
     * The delta coordinate change in y during mouse-move.
     */
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
     * The draggable range of the sash.
     */
    range: IRange;

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
    readonly onDidEnd: Register<ISashEvent>;

    /**
     * Fires when the sash is resetted to the default position (double-click).
     */
    readonly onDidReset: Register<void>;
    
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
     * when vertical: the draggable range of the sash in x.
     * when horizontal: the draggable range of the sash in y.
     */
    private _range: IRange;

    /* The HTMLElement of the sash. */
    private _element!: HTMLElement;
    /* The parent HTMLElement to be appended to. */
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
	private readonly _onDidEnd = this.__register(new Emitter<ISashEvent>());
	public readonly onDidEnd: Register<ISashEvent> = this._onDidEnd.registerListener;

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
            this._range = opts.range;
        } else {
            this._range = { start: -1, end: -1 };
        }

        this.__render();
    }

    // [getter / setter]

    get defaultPosition(): number {
        return this._defaultPosition;
    }

    get range(): IRange {
        return this._range;
    }

    set range(newVal: IRange) {
        this._range = newVal;
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

        this.__register(addDisposableListener(this._element, EventType.mousedown, e => this._initDrag(e)));
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
            this._element.classList.add('vertical');
            this._element.style.width = `${this.size}px`;
            this._element.style.left = `${this._defaultPosition}px`;
        } else {
            this._element.classList.add('horizontal');
            this._element.style.height = `${this.size}px`;
            this._element.style.top = `${this._defaultPosition}px`;
        }

        this._parentElement.append(this._element);
    }

    /**
     * @description Once the {@link Sash} has been mouse-downed, function will 
     * be invoked to achieve draggable animation.
     * @param initEvent The mouse event when the mouse-downed.
     */
    private _initDrag(initEvent: MouseEvent): void {
        
        initEvent.preventDefault();

        // The start of coordinate (x / y) when mouse-downed.
        let startCoordinate = 0;
        // The start of dimension (width or height) of the sash when mouse-downed.
        let startDimention = 0;
        // The previous coordinate (x / y) when mouse-moved.
        let firstDrag = true;
        let prevX = 0, prevY = 0;
        let prevEventData: ISashEvent = {
            startX: initEvent.pageX,
            startY: initEvent.pageY,
            currentX: initEvent.pageX,
            currentY: initEvent.pageY,
            deltaX: 0,
            deltaY: 0
        };

        // fire on did start dragging
        this._onDidStart.fire(prevEventData);

        const disposables = new DisposableManager();

        /**
         * The CSS stylesheet is neccessary when the user cursor is reaching the
         * edge of the sash range but still wish the cursor style to be 
         * consistent. Will be removed once the mouse-up event happens.
         */
        const cursorStyleDisposable = createStyleInCSS(this._element);
        const cursor = (this._orientation === Orientation.Vertical) ? 'ew-resize' : 'ns-resize';
        cursorStyleDisposable.style.textContent = `* { cursor: ${cursor} !important; }`;
        disposables.register(cursorStyleDisposable);

        /**
         * @readonly Comments on implementation of using local variable callbacks.
         *  1. So that listener can be removed properly.
         *  2. So that `this` argument is referring to the {@link Sash} object 
         *     instead of the actual HTMLElement.
         */

        let mouseMoveCallback: (e: MouseEvent) => void;
        let mouseUpCallback = () => {
            disposables.dispose();
            this._onDidEnd.fire(prevEventData);
        };

        // dragging horizontally
        if (this._orientation === Orientation.Vertical) {
            
            mouseMoveCallback = (e: MouseEvent) => {
                if (this._range && (e.clientX < this._range.start || (e.clientX > this._range.end && this._range.end !== -1))) {
                    return;
                }

                this._element.style.left = (startDimention + e.pageX - startCoordinate) + 'px';
                
                // To prevent firing the wrong onDidMove event at the first time.
                if (firstDrag === true) {
                    prevX = initEvent.pageX;
                    prevY = initEvent.pageY;
                    firstDrag = false;
                }

                const eventData: ISashEvent = { startX: initEvent.pageX, startY: initEvent.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY };
                this._onDidMove.fire(eventData);

                prevEventData = eventData;
                prevX = e.pageX;
                prevY = e.pageY;
            };
            
            startCoordinate = initEvent.pageX;
            startDimention = parseInt(this._element.style.left, 10);
        } 
        // dragging vertically
        else {
            
            mouseMoveCallback = (e: MouseEvent) => {
                if (this._range && (e.clientY < this._range.start || (e.clientY > this._range.end && this._range.end !== -1))) {
                    return;
                }

                this._element.style.top = (startDimention + initEvent.pageY - startCoordinate) + 'px';
                
                if (firstDrag === true) {
                    prevX = initEvent.pageX;
                    prevY = initEvent.pageY;
                    firstDrag = false;
                }

                const eventData: ISashEvent = { startX: initEvent.pageX, startY: initEvent.pageY, currentX: e.pageX, currentY: e.pageY, deltaX: e.pageX - prevX, deltaY: e.pageY - prevY };
                this._onDidMove.fire(eventData);
                
                prevEventData = eventData;
                prevX = e.pageX;
                prevY = e.pageY;
            };
    
            startCoordinate = initEvent.pageY;
            startDimention = parseInt(this._element.style.top, 10);
        }

        // listeners registration
        disposables.register(addDisposableListener(document.documentElement, EventType.mousemove, mouseMoveCallback));
        disposables.register(addDisposableListener(document.documentElement, EventType.mouseup, mouseUpCallback));
    }

}