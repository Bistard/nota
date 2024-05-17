import "src/base/browser/secondary/toggleCollapseButton/toggleCollapseButton.scss";
import { CollapseState, DirectionX, DirectionY } from "src/base/browser/basic/dom";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Emitter, Register } from "src/base/common/event";
import { assert, panic } from "src/base/common/utilities/panic";
import { isNonNullable } from "src/base/common/utilities/type";

/**
 * An construction interface for constructing {@link ToggleCollapseButton}.
 */
export interface IToggleCollapseButtonOptions {

    /**
     * The initial state.
     */
    readonly initState: CollapseState;

    /**
     * Specifies the horizontal position of the button relative to its parent.
     * The button is always centered at the specified position.
     */
    readonly positionX?: DirectionX;

    /**
     * Defines the horizontal offset (in pixels) from the specified `positionX` where the 
     * button will be placed.
     */
    readonly positionOffsetX?: number;

    /**
     * Specifies the vertical position of the button relative to its parent.
     * The button is always centered at the specified position.
     */
    readonly positionY?: DirectionY;

    /**
     * Defines the vertical offset (in pixels) from the specified `positionY` where the 
     * button will be placed.
     */
    readonly positionOffsetY?: number;

    /**
     * Indicates the direction in which the button will face before it collapses. 
     * The expansion direction will be the opposite of this.
     */
    readonly direction: DirectionX | DirectionY;

    /**
     * If provided, the button will be set with the z-index. Otherwise the 
     * z-index will be calculated automatically.
     */
    readonly zIndex?: number;
}

/**
 * An interface only for {@link ToggleCollapseButton}.
 */
export interface IToggleCollapseButton extends IWidget {
    
    /**
     * The current state.
     */
    readonly state: CollapseState;

    /**
     * Fires when the button whether collapsed.
     */
    readonly onDidCollapseStateChange: Register<CollapseState>;
}

/**
 * @class ToggleCollapseButton is designed to control and display a button that 
 * toggles between collapsed and expanded states, affecting associated content 
 * accordingly.
 * 
 * It provides detailed configuration options, allowing for precise control over 
 * the initial state, position, offset, direction, and optional z-index of the 
 * button.
 */
export class ToggleCollapseButton extends Widget implements IToggleCollapseButton {

    // [fields]

    private readonly _opts: IToggleCollapseButtonOptions;
    private _button?: HTMLElement;

    private _rotationAngle: number; // An angle that decides the collapsing direction of the button (for rendering purpose)
    private _collapseState: CollapseState; // the current state

    // [event]

    private readonly _onDidCollapseStateChange = this.__register(new Emitter<CollapseState>());
    public readonly onDidCollapseStateChange = this._onDidCollapseStateChange.registerListener;

    // [constructor]

    constructor(opts: IToggleCollapseButtonOptions) {
        super();
        this._opts = opts;
        this._rotationAngle = 0;
        this._collapseState = opts.initState;
    }

    // [public methods]

    get state(): CollapseState {
        return this._collapseState;
    }
    
    // [protected override methods]

    protected override __render(element: HTMLElement): void {
        const button = document.createElement('div');
        button.classList.add('toggle-collapse-button');
        button.style.position = 'absolute';
        this._button = button;

        // use 'button' to increase hover area
        const container = document.createElement('button');
        container.classList.add('container');

        const topPart = document.createElement('div');
        topPart.classList.add('button-part', 'button-top');
    
        const bottomPart = document.createElement('div');
        bottomPart.classList.add('button-part', 'button-bottom');
        
        container.appendChild(topPart);
        container.appendChild(bottomPart);
        button.appendChild(container);
        element.appendChild(button);
    }

    protected override __applyStyle(element: HTMLElement): void {
        const button = assert(this._button);
        const { positionX, positionOffsetX, positionY, positionOffsetY, direction } = this._opts;

        // set position of the button
        if (positionX !== undefined && positionOffsetX !== undefined) {
            if (positionX === DirectionX.Left) {
                button.style.left = `${positionOffsetX}px`;
            } else if (positionX === DirectionX.Right) {
                button.style.right = `${positionOffsetX}px`;
            }
        }

        if (positionY !== undefined && positionOffsetY !== undefined) {
            if (positionY === DirectionY.Top) {
                button.style.top = `${positionOffsetY}px`;
            } else if (positionY === DirectionY.Bottom) {
                button.style.bottom = `${positionOffsetY}px`;
            }
        }

        /**
         * Adjusts the z-index of the collapse button to ensure its hoverability.
         * The button is rendered with a negative offset outside its parent div, 
         * which can cause it to visually overlap with another div.
         * 
         * If this overlapping div shares the same z-index as the button's parent 
         * and appears later in the DOM, the button may not be hoverable.
         * 
         * To prevent this issue, the button's z-index is increased by 1.
         */
        if (isNonNullable(this._opts.zIndex)) {
            button.style.zIndex = `${this._opts.zIndex}`;
        } else {
            const zIndex = getComputedStyle(button).getPropertyValue('z-index');
            const newZIndex = zIndex === 'auto' ? 1 : Number(zIndex) + 1;
            button.style.zIndex = `${newZIndex}`;
        }

        // centralize the button if either positionX or positionY is not provided
        if (positionX !== undefined && positionY === undefined) {
            button.style.top = `50%`;
            button.style.transform = `translateY(-50%)`;
        } else if (positionY !== undefined && positionX === undefined) {
            button.style.left = `50%`;
            button.style.transform = `translateX(-50%)`;
        }
        
        // set the collapse direction of the button (which the button should facing to)
        switch (direction) {
            case DirectionX.Left:
                this._rotationAngle = 0;
                break;
            case DirectionX.Right:
                this._rotationAngle = 180;
                break;
            case DirectionY.Top:
                this._rotationAngle = 90;
                break;
            case DirectionY.Bottom:
                this._rotationAngle = -90;
                break;
            default:
                panic(`[ToggleCollapseButton] invalid direction: ${direction}`);
        }
        
        if (this._collapseState === CollapseState.Collapse) {
            // default state is collapse, we flip it over.
            this.__flipOver(button);
        } else {
            // default is expand, no flip over.
            button.style.transform += ` rotate(${this._rotationAngle}deg)`;
        }
    }

    protected override __registerListeners(element: HTMLElement): void {
        const button = assert(this._button);

        // click trigger collapse/expand
        this.onClick(button, () => {

            // toggle state
            this._collapseState = (this._collapseState === CollapseState.Collapse)
                ? CollapseState.Expand
                : CollapseState.Collapse;

            this.__flipOver(button);
            this._onDidCollapseStateChange.fire(this._collapseState);
        });
    }

    private __flipOver(button: HTMLElement): void {
        this._rotationAngle = (this._rotationAngle + 180) % 360;
        button.style.transform = `rotate(${this._rotationAngle}deg)`;
    }
}
