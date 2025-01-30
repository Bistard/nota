import "src/base/browser/basic/hoverBox/hoverBox.scss";
import {  DirectionY, type Direction, DomUtility, addDisposableListener, EventType, DirectionX } from "src/base/browser/basic/dom";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Coordinate, IRect, ISize } from "src/base/common/utilities/size";
import { IKeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { KeyCode } from "src/base/common/keyboard";
import { mixin } from "src/base/common/utilities/object";

/**
 * A construction option for {@link HoverBox}.
 * @note Default option see {@link defaultHoverBoxOption}
 */
export interface IHoverBoxOptions {

    /**
     * The full text for displaying in the hover box.
     */
    readonly text: string;

    /**
     * A target of the {@link IHoverBox} for hovering. This determines the 
     * position of the hover and it will only be hidden when the mouse leaves 
     * both the hover and the target. 
     *      - A HTMLElement can be used for simple cases and 
     *      - a {@link IHoverTarget} for more complex cases where multiple 
     *          elements are required.
     */
    readonly target: HTMLElement | IHoverTarget;

    /**
     * Options that defines where the hover is positioned.
     */
    readonly position?: IHoverPositionOptions;

    /**
     * Options that defines how long the hover is shown and when it hides.
     */
    readonly persistence?: IHoverPersistenceOptions;

    /**
     * Options that define how the hover looks.
     */
    readonly appearance?: IHoverAppearanceOptions;
}

/**
 * A target for a hover.
 */
export interface IHoverTarget {
    /**
     * A set of target elements used to position the hover. If multiple elements are used the hover
     * will try to not overlap any target element. An example use case for this is show a hover for
     * wrapped text.
     */
    readonly targetElements: readonly HTMLElement[];
}

export interface IHoverPositionOptions {

    /**
     * Position of the hover. 
     * @default DirectionY.Top
     * 
     * The default is to show above the `target`. This option will be ignored
     * if there is not enough room to layout the hover in the specified position, 
     * unless the forcePosition option is set.
     * 
     * If {@link Coordinate} is provided, the position will be entirely decided
     * by the coordinate, instead of relative to the `target`.
     */
    readonly hoverPosition?: Direction | Coordinate;

    /**
     * Force the hover position.
     * @default false
     */
    readonly forcePosition?: boolean;

    /**
     * If provided, the hoverBox will have given offset based on the position.
     * @default {{x: 0, y: 0}}
     */
    readonly offest?: {
        x: number,
        y: number,
    };
}

export interface IHoverPersistenceOptions {

    /**
     * Whether to hide the hover when a key is pressed.
     * @default true
     */
    readonly hideOnKeyDown?: boolean;

    /**
     * Indicates if the {@link IHoverBox} should be locked initially. If false
     * provided. User have to press the 'alt/option' key to lock the hover box.
     * @default false
     * 
     * Lock means the hover box will never hidden in any cases.
     */
    readonly locked?: boolean;
}

export interface IHoverAppearanceOptions {
    
    /**
     * An optional array of classes to add to the hover element.
     */
    readonly additionalClasses?: string[];

    /**
     * Whether to skip the fade in animation.
     * @default false
     * 
     * This should be used when hovering from one hover to another in the same 
     * group so it looks like the hover is moving from one element to the other.
     */
    readonly skipFadeInAnimation?: boolean;
}

/**
 * An interface only for {@link HoverBox}.
 * // TODO: doc
 */
export interface IHoverBox extends IWidget {
    layout(): void;
    toggleLock(): void;
}

export class HoverBox extends Widget implements IHoverBox {

    // [fields]
    
    private readonly text: string;
    private readonly target: HTMLElement | IHoverTarget;
    private readonly positionOptions   : Required<IHoverPositionOptions>;
    private readonly persistenceOptions: Required<IHoverPersistenceOptions>;
    private readonly appearanceOptions : Required<IHoverAppearanceOptions>;
    
    /** 
     * Set to 1 because whenever a hoverbox is constructed, it must already on 
     * 1 target. 
     */
    private _mouseInTargetCounter: number;
    private _onAltkDown: boolean;
    private _locked: boolean;

    // [constructor]
    
    constructor(
        options: IHoverBoxOptions,
        @IKeyboardService private readonly keyboardService: IKeyboardService
    ) {
        super();
        const resolvedOptions = mixin<typeof defaultHoverBoxOption>(options, defaultHoverBoxOption, false);
        this.text               = resolvedOptions.text;
        this.target             = resolvedOptions.target;
        this.positionOptions    = resolvedOptions.position;
        this.persistenceOptions = resolvedOptions.persistence;
        this.appearanceOptions  = resolvedOptions.appearance;
        this._locked = !!this.persistenceOptions.locked;

        this._mouseInTargetCounter = 1;
        this._onAltkDown = false;
    }

    // [public methods]

    public layout(): void {

        if (!this.rendered) return;
        const element = this.element;
        const viewSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Measure the hover itself
        const hoverSize = this.__getHoverSize();
        
        // x, y coordinate
        const untailoredHoverXY = this.__determineHoverXY(hoverSize, viewSize);

        const offset = this.positionOptions.offest;
        
        let x = untailoredHoverXY.x + offset.x;
        let y = untailoredHoverXY.y + offset.y;
        
        // Adjust if out of viewport
        const maxX = viewSize.width - hoverSize.width;
        const maxY = viewSize.height - hoverSize.height;

        x = Math.max(0, x);
        y = Math.max(0, y);

        x = Math.min(x , maxX);
        y = Math.min(y , maxY);

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    public toggleLock(): void {
        this._locked = !this._locked;
        if (!this._locked && this._mouseInTargetCounter <= 0) {
            this.dispose();
        }
    }

    // [private methods]

    protected override __render(element: HTMLElement): void {
        element.classList.add('hover-box');

        if (!this.appearanceOptions.skipFadeInAnimation) {
            element.classList.add('fade-in');
        }

        if (this.appearanceOptions.additionalClasses) {
            this.appearanceOptions.additionalClasses.forEach(cls => element.classList.add(cls));
        }

        const textDiv = document.createElement('div');
        textDiv.classList.add('hover-content');
        textDiv.textContent = this.text;
        element.appendChild(textDiv);

        this.layout();
    }

    protected override __applyStyle(element: HTMLElement): void {
        // TODO: use css instead of hardcode on js
        element.style.position = 'absolute';
        element.style.zIndex = '9999';
    }

    protected override __registerListeners(element: HTMLElement): void {
        const targetElements = !DomUtility.Elements.isHTMLElement(this.target) 
            ? this.target.targetElements 
            : [this.target];
            
        for (const t of targetElements) {
            this.__register(addDisposableListener(t, EventType.mouseenter, () => {
                
                this._mouseInTargetCounter += 1;
            }));

            this.__register(addDisposableListener(t, EventType.mouseleave, () => {
                this._mouseInTargetCounter -= 1;
                this.__tryHideOnMouseOut();
            }));
        }

        this.__register(this.keyboardService.onKeydown(event => {
            if (this._onAltkDown) {
                return;
            }
            if (event.key === KeyCode.Alt) {
                this._onAltkDown = true;
                this.toggleLock();
            } else {
                if (this.persistenceOptions.hideOnKeyDown && !this._locked) {
                    this.dispose();
                }
            }
        }));

        this.__register(this.keyboardService.onKeyup(event => {
            if (event.key === KeyCode.Alt) {
                this._onAltkDown = false;
                this.toggleLock();
            }
        }));
    }

    private __tryHideOnMouseOut(): void {
        if (!this._locked && this._mouseInTargetCounter <= 0) {
            this.dispose();
        }
    }
    
    private __getHoverSize(): ISize {
        const computed = getComputedStyle(this.element);
        const width = DomUtility.Attrs.getTotalWidth(this.element, computed);
        const height = DomUtility.Attrs.getTotalHeight(this.element, computed); 
        return { width, height };
    }
    
    private __determineHoverXY(hoverSize: ISize, viewSize: ISize): Coordinate {
        let x = 0;
        let y = 0;

        // Position relative to target
        const targetRect = getTargetRect(this.target);

        if (Coordinate.is(this.positionOptions.hoverPosition)) {
            const coordinate = this.positionOptions.hoverPosition;
            return coordinate;
        }

        const direction = this.__determineHoverDirection(targetRect, hoverSize, viewSize);
        if (direction === DirectionY.Top) {
            y = targetRect.top - hoverSize.height;
            x = targetRect.left + (targetRect.width - hoverSize.width) / 2;
        } else if (direction === DirectionY.Bottom) {
            y = targetRect.top + targetRect.height;
            x = targetRect.left + (targetRect.width - hoverSize.width) / 2;
        } else if (direction === DirectionX.Left) {
            y = targetRect.top + (targetRect.height - hoverSize.height) / 2;
            x = targetRect.left - hoverSize.width;
        } else if (direction === DirectionX.Right) {
            y = targetRect.top + (targetRect.height - hoverSize.height) / 2;
            x = targetRect.left + targetRect.width;
        } else {
            // fallback
            y = targetRect.top - hoverSize.height;
            x = targetRect.left;
        }
        
        return new Coordinate(x, y);
    }

    private __determineHoverDirection(targetRect: IRect, hoverSize: ISize, viewSize: ISize): Direction {
        
        // default Direction is Top(above the target)
        const desiredPosition = this.positionOptions.hoverPosition;
        const force = this.positionOptions.forcePosition;
        let finalPos = desiredPosition as Direction;

        if (force) {
            return finalPos as Direction;
        }
        
        // No force determine fits
        const fitsAbove = (targetRect.top - hoverSize.height) >= 0;
        const fitsBelow = (targetRect.top + targetRect.height + hoverSize.height) <= viewSize.height;
        const fitsLeft =  (targetRect.left - hoverSize.width) >= 0;
        const fitsRight = (targetRect.left + targetRect.width + hoverSize.width) <= viewSize.width;

        // Default order: top, bottom, left, right
        const fits: Record<Direction, boolean> = {
            [DirectionY.Top]: fitsAbove,
            [DirectionY.Bottom]: fitsBelow,
            [DirectionX.Left]: fitsLeft,
            [DirectionX.Right]: fitsRight,
        };
        
        if (!fits[finalPos]) {
            for (const [direction, fit] of Object.entries(fits)) {
                if (fit) {
                    finalPos = direction as Direction;
                }
            }
        }
        return finalPos;
    }
}

const defaultHoverBoxOption = {
    text: '',
    target: document.body,
    position: {
        hoverPosition: DirectionY.Top,
        forcePosition: false,
        offest: Coordinate.None,
    },
    persistence: { 
        hideOnKeyDown: true,
        locked: false,
    },
    appearance: {
        additionalClasses: [],
        skipFadeInAnimation: false,
    }
};

function computeRect(target: HTMLElement): { top: number, left: number, width: number, height: number } {
    const styles = getComputedStyle(target);
    const top    = DomUtility.Attrs.getViewportTop(target);
    const left   = DomUtility.Attrs.getViewportLeft(target);
    const width  = DomUtility.Attrs.getTotalWidth(target, styles);
    const height = DomUtility.Attrs.getTotalHeight(target, styles);
    return { top, left, width, height };
}

/**
 * Compute a combined rect for multiple elements (used if target is IHoverTarget).
 */
function computeCombinedRect(elements: readonly HTMLElement[]): { top: number; left: number; width: number; height: number } {
    let left   = Number.MAX_SAFE_INTEGER;
    let top    = Number.MAX_SAFE_INTEGER;
    let right  = Number.MIN_SAFE_INTEGER;
    let bottom = Number.MIN_SAFE_INTEGER;

    for (const e of elements) {
        const r = computeRect(e);
        if (r.left < left) left = r.left;
        if (r.top < top) top = r.top;
        if ((r.left + r.width) > right) right = r.left + r.width;
        if ((r.top + r.height) > bottom) bottom = r.top + r.height;
    }

    return {
        top,
        left,
        width: right - left,
        height: bottom - top
    };
}

function getTargetRect(target: HTMLElement | IHoverTarget): IRect {
    if (!DomUtility.Elements.isHTMLElement(target)) {
        return computeCombinedRect(target.targetElements);
    } else {
        return computeRect(target);
    }
}