import "src/base/browser/secondary/toggleCollapseButton/media.scss";
import { CollapseState } from "src/base/browser/basic/dom";
import { Widget } from "src/base/browser/basic/widget";
import { Emitter } from "src/base/common/event";
import { assert } from "src/base/common/utilities/panic";

export class ToggleCollapseButton extends Widget {

    // [fields]

    private _button?: HTMLElement;
    private _collapseState: CollapseState;

    // [event]

    private readonly _onDidCollapseStateChange = this.__register(new Emitter<CollapseState>());
    public readonly onDidCollapseStateChange = this._onDidCollapseStateChange.registerListener;

    // [constructor]

    constructor() {
        super();
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