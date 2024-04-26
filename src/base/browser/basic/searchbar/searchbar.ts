import { EventType, addDisposableListener } from "src/base/browser/basic/dom";
import "src/base/browser/basic/searchbar/searchbar.scss";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { createIcon } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";
import { assert } from "src/base/common/utilities/panic";
import { IDimension } from "src/base/common/utilities/size";

export interface ITypeEvent {
    /**
     * The current text on the search bar.
     */
    readonly text: string;
}

export interface ISearchBarOpts {

    readonly dimension?: IDimension;
    readonly classes?: string[];
    
    readonly icon?: Icons;
    readonly placeHolder?: string;
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
    readonly onDidType: Register<ITypeEvent>;

    /**
     * Fires when the search bar is being focused.
     */
    readonly onDidFocus: Register<FocusEvent>;

    /**
     * Fires when the search bar is being blurred.
     */
    readonly onDidBlur: Register<FocusEvent>;

    /**
     * @description Set the given text that displaying in the middle of the bar.
     * @param text The given text.
     */
    setText(text: string): void;
}

export class SearchBar extends Widget implements ISearchBar {

    // [field]

    private _placeHolder: string;
    private _opts?: ISearchBarOpts;
    private _innerText?: HTMLInputElement;

    // [event]

    private readonly _onDidType = this.__register(new Emitter<ITypeEvent>());
    public readonly onDidType = this._onDidType.registerListener;

    private readonly _onDidFocus = this.__register(new Emitter<FocusEvent>());
    public readonly onDidFocus = this._onDidFocus.registerListener;
    
    private readonly _onDidBlur = this.__register(new Emitter<FocusEvent>());
    public readonly onDidBlur = this._onDidBlur.registerListener;

    // [constructor]

    constructor(opts?: ISearchBarOpts) {
        super();
        this._opts = opts;
        this._placeHolder = this._opts?.placeHolder ?? '';
    }

    // [public methods]

    get width(): number {
        return Number(this.element.style.width);
    }

    get height(): number {
        return Number(this.element.style.height);
    }

    get text(): string {
        return this._innerText?.value ?? '';
    }

    get isEmpty(): boolean {
        return this.text === '';
    }

    public setText(text: string): void {
        if (this._innerText) {
            this._innerText.value = text;
        }
    }

    // [protected methods]

    protected override __render(): void {
        let searchIcon: HTMLElement | undefined;
        if (this._opts?.icon) {
            searchIcon = createIcon(this._opts?.icon);
        }
    
        const innerText = document.createElement('input');
        innerText.className = 'inner-text';
        innerText.placeholder = this._placeHolder;
        innerText.type = 'text';
    
        this.element.append(innerText);
        if (searchIcon) {
            this.element.append(searchIcon);
        }

        this._innerText = innerText;
    }    
    
    protected override __applyStyle(): void {
        
        this.element.classList.add('search-bar');
        this.element.classList.add(...(this._opts?.classes ?? []));
    }

    protected override __registerListeners(): void {
        const innerText = assert(this._innerText);
        
        this.__register(addDisposableListener(innerText, EventType.input, () => {
            this._onDidType.fire({ text: innerText.value });
        }));
        
        this.__register(addDisposableListener(innerText, EventType.focus, event => {
            this._onDidFocus.fire(event);
        }));
        
        this.__register(addDisposableListener(innerText, EventType.blur, event => {
            this._onDidBlur.fire(event);
        }));
    }
    
    // [private helper methods]
}