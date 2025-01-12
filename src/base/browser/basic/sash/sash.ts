import "src/base/browser/basic/sash/sash.scss";
import { AbstractSashController, HorizontalSashController, IAbstractSashController, VerticalSashController } from "src/base/browser/basic/sash/sashController";
import { Disposable, DisposableBucket } from "src/base/common/dispose";
import { addDisposableListener, EventType, Orientation } from "src/base/browser/basic/dom";
import { Emitter, Register } from "src/base/common/event";
import { IRange } from "src/base/common/structures/range";
import { Constructor, Mutable } from "src/base/common/utilities/type";
import { cancellableTimeout } from "src/base/common/utilities/async";
import { VisibilityController } from "src/base/browser/basic/visibilityController";
import { Time } from "src/base/common/date";
import { Lazy } from "src/base/common/lazy";

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
     * The width or height of the {@link Sash} depends on the `orientation`.
     * @default 2
     */
    readonly size?: number;

    /**
     * The range (closed interval) that the {@link Sash} is allowed to move 
     * between.
     * 
     * @note If -1 provided in any intervals, means no restrictions.
     * @note When reaching the edge of the range, the position (left / top) of 
     *       the sash will not be placed at the exact 
     * @default range { start: -1, end: -1 }.
     */
    readonly range?: IRange;

    /**
     * If a controller is provided, the behaviors of the sash under the 
     * operations from the users can be customized by the caller.
     * 
     * @warn Considers the non-perfect design of {@link AbstractSashController},
     * customization by overriding abstract methods are very likely failed to 
     * work. Reading codes from {@link VerticalSashController} might help to 
     * understand how the controller works.
     */
    readonly controller?: Constructor<AbstractSashController>;

    /**
     * Sets the visibility of the sash. If visible, the sash will has a class 
     * `visible`.
     * @default false
     */
    readonly visible?: boolean;

    /**
     * If the sash is enabled in the beginning. If visible, the sash will has a 
     * class `disable`.
     * @default true
     */
    readonly enable?: boolean;
}

/**
 * The event fires when the {@link ISash} mouse-move / mouse-down / mouse-up.
 */
export interface ISashEvent {
    
    /**
     * The current coordinate of sash in x during mouse-move.
     */
    readonly currentX: number;

    /**
     * The current coordinate of sash in y during mouse-move.
     */
	readonly currentY: number;

    /**
     * The delta coordinate change in x during mouse-move compares with the 
     * previous mouse-move.
     */
    readonly deltaX: number;
    
    /**
     * The delta coordinate change in y during mouse-move compares with the 
     * previous mouse-move.
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
     * The width / height of the sash. 
     * @default 4
     */
    size: number;

    /**
     * Describes if the sash is vertical or horizontal.
     */
    readonly orientation: Orientation;

    /**
     * The current left / top of the sash relatives to the parent container. 
     * Modify this attribute will affect the next rerender position by calling
     * {@link ISash.reLayout()}.
     */
    position: number;

    /**
     * The draggable range of the sash.
     */
    range: IRange;

    /**
     * If sets to false the sash is no longer supports dragging.
     * @default true
     */
    enable: boolean;

    /**
     * If sets to true the sash will be visible even if not hovering.
     * @default false
     */
    visible: boolean;

    /**
     * Fires when the sash dragging is started (mouse-down).
     */
    readonly onDidStart: Register<ISashEvent>;

    /**
     * Fires when the sash dragging is moved (mouse-move).
     */
    readonly onDidMove: Register<ISashEvent>;
    
    /**
     * Fires when the sash dragging is stopped (mouse-up).
     */
    readonly onDidEnd: Register<void>;

    /**
     * Fires when the sash is double-clicked.
     */
    readonly onDidReset: Register<void>;
    
    /**
     * @description Rerenders the {@link Sash}. The position will be determined
     * by the attribute {@link ISash.position}.
     */
    reLayout(): void;

    /**
     * @description Registers DOM-related listeners.
     */
    registerListeners(): void;

    /**
     * @description Provide simple way to update the sash configurations.
     */
    setOptions(opts: Pick<ISashOpts, 'enable' | 'range' | 'size' | 'visible'>): void;

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
 * 
 * @note Given a {@link IRange} to determine the draggable range of the sash.
 * 
 * @note When the sash reaches the edge of its range, the actual position (left
 *  / top) is not touching the edge of its range exactly due to the fact that
 * the sash will be placed at the middle of the edge. The offset of that small
 * position is the half of the sash size (width / height).
 */
export class Sash extends Disposable implements ISash {

    // [fields]

    /**
     * when vertical: width of the sash.
     * when horizontal: height of the sash.
     */
    public _size: number;

    /**
     * when vertical: left of the sash relatives to the container.
     * when horizontal: top of the sash relatives to the container.
     */
    private _position: number;

    /** 
     * when vertical: the draggable range of the sash in x.
     * when horizontal: the draggable range of the sash in y.
     * 
     * @note If -1 provided in any intervals, means no restrictions.
     */
    private _range: IRange;

    /** 
     * {@link Orientation.Horizontal} means sash lays out horizontally.
     * {@link Orientation.vertical} means lays out vertically.
     */
    private readonly _orientation: Orientation;

    /* The HTMLElement of the sash. */
    private readonly _element!: HTMLElement;

    /* The parent HTMLElement to be appended to. */
    private readonly _parentElement: HTMLElement;

    /** if the sash is enabled. */
    private _enabled: boolean;

    /** If the sash is currently marked as hovering. */
    private _hovering: boolean;

    /** visibility of the sash in general case. */
    private _visible: boolean;
    private readonly _visibilityController: VisibilityController;
    
    /** Controls the mouse behavior */
    private readonly _controller: Lazy<AbstractSashController>;

    // [event]

    /** An event which fires whenever the user starts dragging the sash. */
	private readonly _onDidStart = this.__register(new Emitter<ISashEvent>());
    public readonly onDidStart: Register<ISashEvent> = this._onDidStart.registerListener;

	/** An event which fires whenever the user moves the mouse while dragging the sash. */
    private readonly _onDidMove = this.__register(new Emitter<ISashEvent>());
	public readonly onDidMove: Register<ISashEvent> = this._onDidMove.registerListener;

	/** An event which fires whenever the user stops dragging the sash. */
	private readonly _onDidEnd = this.__register(new Emitter<void>());
	public readonly onDidEnd: Register<void> = this._onDidEnd.registerListener;

    /** An event which fires whenever the user double clicks the sash. */
    private readonly _onDidReset = this.__register(new Emitter<void>());
	public readonly onDidReset: Register<void> = this._onDidReset.registerListener;

    // [constructor]

    constructor(parentElement: HTMLElement, opts: ISashOpts) {
        super();

        this._parentElement = parentElement;
        this._orientation = opts.orientation;
        this._position = opts.initPosition ?? 0;
        this._size = opts.size ?? 2;
        this._range = opts.range ?? { start: -1, end: -1 };
        this._enabled = opts.enable ?? true;
        this._visible = opts.visible ?? false;
        this._hovering = false;
        this._visibilityController = new VisibilityController('visible', 'invisible', 'fade', false);
        this._controller = this.__register(new Lazy<AbstractSashController>(() => {
            const ctorOptions = <const>[
                (e: ISashEvent) => this._onDidStart.fire(e),
                (e: ISashEvent) => this._onDidMove.fire(e),
                () => this._onDidEnd.fire(),
            ];
            
            if (opts.controller) {
                return new opts.controller(this, ...ctorOptions);
            } else if (this._orientation === Orientation.Vertical) {
                return new VerticalSashController(this, ...ctorOptions);
            } else {
                return new HorizontalSashController(this, ...ctorOptions);
            }
        }));
        this.__render();

        this._visibilityController.setDomNode(this._element);
    }

    // [getter / setter]

    get element(): HTMLElement {
        return this._element;
    }

    get size(): number {
        return this._size;
    }

    set size(val: number) {
        if (val === this._size) {
            return;
        }

        this._size = val;
        if (this._orientation === Orientation.Vertical) {
            this._element.style.width = `${val}px`;
        } else {
            this._element.style.height = `${val}px`;
        }
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

    set visible(val: boolean) {
        if (this._visible !== val) {
            this._visible = val;
            this._visibilityController.setVisibility(this._visible);
        }
    }

    get visible(): boolean {
        return this._visible;
    }

    set enable(val: boolean) {
        if (this._enabled !== val) {
            this._enabled = val;
            this._element.classList.toggle('disable', !this._enabled);
        }
    }

    get enable(): boolean {
        return this._enabled;
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
        this._element.remove();
    }

    public reLayout(): void {
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
        this.__register(addDisposableListener(this._element, EventType.mouseenter, () => this.__initHover()));
        this.__register(addDisposableListener(this._element, EventType.doubleClick, () => this._onDidReset.fire()));
    }

    public setOptions(opts: Pick<ISashOpts, 'enable' | 'range' | 'size' | 'visible'>): void {
        this.enable  = opts.enable  ?? this.enable;
        this.visible = opts.visible ?? this.visible;
        this.size    = opts.size    ?? this.size;
        this.range   = opts.range   ?? this.range;
    }

    // [private helper methods]

    private __render(): void {
        (<Mutable<HTMLElement>>this._element) = document.createElement('div');
        this._element.classList.add('sash');

        if (this._orientation === Orientation.Vertical) {
            this._element.classList.add('vertical');
            this._element.style.width = `${this._size}px`;
            this._element.style.left = `${this._position}px`;
        } else {
            this._element.classList.add('horizontal');
            this._element.style.height = `${this._size}px`;
            this._element.style.top = `${this._position}px`;
        }

        this.visible = this._visible;
        this.enable = this._enabled;

        this._parentElement.append(this._element);
    }

    private __initDrag(initEvent: MouseEvent): void {
        initEvent.preventDefault();
        const controller = this._controller.value();
        controller.onMouseStart();
    }
    
    private readonly _hoverDelay = Time.ms(500);
    private __initHover(): void {
        if (this._hovering) {
            return;
        }
        this._hovering = true;

        const cancellable = cancellableTimeout(this._hoverDelay);
        cancellable
            .then(() => {
                this._element.classList.add('hover');
            })
            .catch(() => {}); // cath cancel error

        const bucket = this.__register(new DisposableBucket());
        
        let mouseenter = true;
        let mousedown = false;

        bucket.register(addDisposableListener(this._element, EventType.mouseenter, () => mouseenter = true));
        bucket.register(addDisposableListener(this._element, EventType.mousedown, () => mousedown = true));
        bucket.register(addDisposableListener(window, EventType.mouseup, () => {
            mousedown = false;
            if (!mouseenter) {
                cleanup();
            }
        }));
        bucket.register(addDisposableListener(this._element, EventType.mouseout, () => {
            mouseenter = false;
            if (!mousedown) {
                cleanup();
            }
        }));

        const cleanup = () => {
            this._hovering = false;
            this.release(bucket);
            cancellable.cancel();
            this._element.classList.remove('hover');
        };
    }
}