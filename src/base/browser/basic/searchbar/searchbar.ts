import { IWidget, Widget } from "src/base/browser/basic/widget";
import { createIcon } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { RGBA } from "src/base/common/color";
import { Emitter, Register } from "src/base/common/event";
import { IDimension } from "src/base/common/util/size";

export interface TypeEvent {
    /**
     * The current text on the search bar.
     */
    readonly text: string;
}

export interface ISearchBarOpts {

    readonly dimension?: IDimension;
    readonly classes?: string[];
    
    readonly icon?: Icons;
    readonly emptyText?: string;
}

export interface ISearchBar extends IWidget {

    /**
     * The actual height of the search bar in the DOM.
     */
    readonly height: number;

    /**
     * The actual width of the search bar in the DOM.
     */
    readonly width: number;

    /**
     * The current displaying text of the search bar.
     */
    readonly text: string;

    /**
     * Fires when the search bar is being typed.
     */
    readonly onDidType: Register<TypeEvent>;

    /**
     * @description Set the given text that displaying in the middle of the bar.
     * @param text The given text.
     */
    setText(text: string): void;
}

export class SearchBar extends Widget implements ISearchBar {

    // [field]

    private _emptyText: string;
    private _innerText?: HTMLElement;

    private _opts?: ISearchBarOpts;

    // [event]

    private readonly _onDidType = this.__register(new Emitter<TypeEvent>());
    public readonly onDidType = this._onDidType.registerListener;

    // [constructor]

    constructor(opts?: ISearchBarOpts) {
        super();
        this._opts = opts;
        this._emptyText = this._opts?.emptyText ?? '';
    }

    // [public methods]

    get width(): number {
        return Number(this.element.style.width);
    }

    get height(): number {
        return Number(this.element.style.height);
    }

    get text(): string {
        return this._innerText?.innerText ?? '';
    }

    public setText(text: string): void {
        if (!this._innerText) {
            return;
        }

        this._innerText.innerText = text;
    }

    // [protected methods]

    protected override __render(): void {
        
        // background color
        this.element.style.setProperty('--search-bar-background', (new RGBA(0, 0, 0, 0.05)).toString());

        // inner icon
        let searchIcon: HTMLElement | undefined;
        if (this._opts?.icon) {
            searchIcon = createIcon(this._opts?.icon);
        }

        // inner text
        const innerText = document.createElement('div');
        innerText.className = 'inner-text';
        innerText.innerText = this._emptyText;
        
        // render
        if (searchIcon) {
            this.element.append(searchIcon);
        }
        this.element.append(innerText);
        
    }

    protected override __applyStyle(): void {
        
        this.element.classList.add('search-bar');
        this.element.classList.add(...(this._opts?.classes ?? []));
    }

    protected override __registerListeners(): void {
        
        // TODO
    }

    // [private helper methods]
}