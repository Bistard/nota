import { AbstractSashController, HorizontalSashController, VerticalSashController } from "src/base/browser/basic/sash/sashController";
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
    readonly initPosition?: number;
    
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
     * The {@link HTMLElement} of the sash.
     */
    readonly element: HTMLElement;

    /**
     * The width / height of the sash. Default is 4.
     */
    readonly size: number;

    /**
     * Describes if the sash is vertical or horizontal.
     */
    readonly orientation: Orientation;

    /**
     * The current left / top of the sash relatives to the parent container. 
     * Modify this attribute will affect the next rerender position by calling
     * {@link ISash.relayout()}.
     */
    position: number;

    /**
     * The draggable range of the sash.
     */
    range: IRange;

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
     * Fires when the sash is resetted to the default position (double-click).
     */
    readonly onDidReset: Register<void>;
    
    /**
     * @description Rerenders the {@link Sash}. The position will be determined
     * by the attribute {@link ISash.position}.
     */
    relayout(): void;

    /**
     * @description Registers DOM-related listeners.
     */
    registerListeners(): void;

    /**
     * @description Disposes the {@link Sash} UI component.
     */
    dispose(): void;
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
     * when vertical: left of the sash relatives to the container.
     * when horizontal: top of the sash relatives to the container.
     */
    private _position: number;

    /** 
     * when vertical: the draggable range of the sash in x.
     * when horizontal: the draggable range of the sash in y.
     * 
     * @note If -1 provided in any interals, means no restrictions.
     */
    private _range: IRange;

    /** 
     * {@link Orientation.Horizontal} means sash lays out horizontally.
     * {@link Orientation.vertical} means lays out vertically.
     */
    private _orientation: Orientation;

    /**
     * Using controller to determine the behaviour of the sash movement.
     */
    private _controller?: AbstractSashController;

    /* The HTMLElement of the sash. */
    private _element!: HTMLElement;
    /* The parent HTMLElement to be appended to. */
    private _parentElement: HTMLElement;

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

    // [constructor]

    constructor(parentElement: HTMLElement, opts: ISashOpts) {
        super();

        this._parentElement = parentElement;

        // Options
        this._orientation = opts.orientation;
        this._position = opts.initPosition ?? 0;
        this.size = opts.size ? opts.size : 4;
        if (opts.range) {
            this._range = opts.range;
        } else {
            this._range = { start: -1, end: -1 };
        }

        this.__render();
    }

    // [getter / setter]

    get element(): HTMLElement {
        return this._element;
    }

    get orientation(): Orientation {
        return this._orientation;
    }

    get range(): IRange {
        return this._range;
    }

    set range(newVal: IRange) {
        this._range = newVal;
    }

    get position(): number {
        return this._position;
    }

    set position(newVal: number) {
        this._position = newVal;
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
        this._element.remove();
    }

    public relayout(): void {
        if (this.isDisposed()) {
            return;
        }
        if (this._orientation === Orientation.Vertical) {
            this._element.style.left = `${this._position}px`;
        }
        else {
            this._element.style.top = `${this._position}px`;
        }
    }

    public registerListeners(): void {
        if (this.isDisposed()) {
            return;
        }

        this.__register(addDisposableListener(this._element, EventType.mousedown, e => this.__initDrag(e)));
        this.__register(addDisposableListener(this._element, EventType.doubleclick, () => this._onDidReset.fire()));
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
            this._element.style.left = `${this._position}px`;
        } else {
            this._element.classList.add('horizontal');
            this._element.style.height = `${this.size}px`;
            this._element.style.top = `${this._position}px`;
        }

        this._parentElement.append(this._element);
    }

    /**
     * @description Once the {@link Sash} has been mouse-downed, function will 
     * be invoked to achieve draggable animation.
     * @param initEvent The mouse event when the mouse-downed.
     */
    private __initDrag(initEvent: MouseEvent): void {
        initEvent.preventDefault();

        if (this._orientation === Orientation.Vertical) {
            this._controller = new VerticalSashController(initEvent, this);
        } else {
            this._controller = new HorizontalSashController(initEvent, this);
        }
        this._controller.onMouseStart();
    }

}