import "src/base/browser/secondary/toggleCollapseButton/media.scss";
import { CollapseState, Direction, DirectionX, DirectionY } from "src/base/browser/basic/dom";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { Emitter, Register } from "src/base/common/event";
import { assert, panic } from "src/base/common/utilities/panic";

/**
 * An construction interface for constructing {@link ToggleCollapseButton}.
 */
export interface IToggleCollapseButtonOptions {

    /**
     * Specifies the position of the button relative to its parent. The button 
     * is always centered at the specified position.
     * @example If `position` is 'left', the button will be positioned on the 
     *          left side of its parent.
     */
    readonly position: Direction;

    /**
     * Defines the offset (in pixels) from the specified `position` where the 
     * button will be placed.
     * @example If `positionOffset` is `10` and `position` is `left`, the button 
     *          will be 10 pixels to the right of the left edge of its parent.
     */
    readonly positionOffset: number;
    
    /**
     * Indicates the direction in which the button will face before it collapses. 
     * The expansion direction will be the opposite of this.
     */
    readonly direction: Direction;
}

export interface IToggleCollapseButton extends IWidget {
    
    /**
     * Fires when the button wether collapsed.
     */
    readonly onDidCollapseStateChange: Register<CollapseState>;
}

export class ToggleCollapseButton extends Widget {

    // [fields]

    private readonly _opts: IToggleCollapseButtonOptions;
    private _button?: HTMLElement;
    private _collapseState: CollapseState;

    // [event]

    private readonly _onDidCollapseStateChange = this.__register(new Emitter<CollapseState>());
    public readonly onDidCollapseStateChange = this._onDidCollapseStateChange.registerListener;

    // [constructor]

    constructor(opts: IToggleCollapseButtonOptions) {
        super();
        this._opts = opts;
        this._collapseState = CollapseState.Expand;
    }
    
    // [protected override methods]

    protected override __render(element: HTMLElement): void {
        const button = document.createElement('div');
        button.classList.add('toggle-collapse-button');
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
        const { position, positionOffset, direction } = this._opts;

        // set position of the button
        switch (position) {
            case DirectionX.Left:
                button.style.left = `${positionOffset}px`;
                break;
            case DirectionX.Right:
                button.style.right = `${positionOffset}px`;
                break;
            case DirectionY.Top:
                button.style.top = `${positionOffset}px`;
                break;
            case DirectionY.Bottom:
                button.style.bottom = `${positionOffset}px`;
                break;
            default:
                panic(`[ToggleCollapseButton] invalid position: ${position}`);
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
        if (positionOffset < 0) {
            const zIndex = getComputedStyle(button).getPropertyValue('z-index');
            const newZIndex = zIndex === 'auto' ? 1 : Number(zIndex) + 1;
            button.style.zIndex = `${newZIndex}`;
        }

        // centralize the button
        switch (position) {
            case DirectionX.Left:
            case DirectionX.Right:
                button.style.top = `50%`;
                button.style.transform = `translateY(-50%)`;
                break;
            case DirectionY.Bottom:
            case DirectionY.Top:
                button.style.left = `50%`;
                button.style.transform = `translateX(-50%)`;
                break;
        }
        
        // set the collapse direction of the button (which the button should facing to)
        switch (direction) {
            case DirectionX.Left:
                // noop
                break;
            case DirectionX.Right:
                button.style.transform = `rotate(180deg)`;
                break;
            case DirectionY.Top:
                button.style.transform = `rotate(90deg)`;
                break;
            case DirectionY.Bottom:
                button.style.transform = `rotate(-90deg)`;
                break;
            default:
                panic(`[ToggleCollapseButton] invalid direction: ${direction}`);
        }
    }

    protected override __registerListeners(element: HTMLElement): void {
        const button = assert(this._button);

        this.onClick(button, () => {
            this._collapseState = (this._collapseState === CollapseState.Collapse)
                ? CollapseState.Expand
                : CollapseState.Collapse;
            this._onDidCollapseStateChange.fire(this._collapseState);
        });
    }

    // [public methods]


}