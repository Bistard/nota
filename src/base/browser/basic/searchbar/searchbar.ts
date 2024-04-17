import "src/base/browser/basic/searchbar/searchbar.scss";
import { IWidget, Widget } from "src/base/browser/basic/widget";
import { createIcon } from "src/base/browser/icon/iconRegistry";
import { Icons } from "src/base/browser/icon/icons";
import { Emitter, Register } from "src/base/common/event";
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
    private _isPlaceholderText: boolean = true; 

    // [event]

    private readonly _onDidType = this.__register(new Emitter<ITypeEvent>());
    public readonly onDidType = this._onDidType.registerListener;

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

    public setText(text: string): void {
        if (this._innerText) {
            this._innerText.value = text;
            this._isPlaceholderText = true;
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
    
        if (searchIcon) {
            this.element.append(searchIcon);
        }
        this.element.append(innerText);
        this._innerText = innerText as HTMLInputElement;
    }    
    
    protected override __applyStyle(): void {
        
        this.element.classList.add('search-bar');
        this.element.classList.add(...(this._opts?.classes ?? []));
    }

    protected override __registerListeners(): void {
        this._innerText?.addEventListener('input', (event: Event) => {
            const target = event.target as HTMLInputElement;
            this._onDidType.fire({text: target.value});
            this._isPlaceholderText = false;  // Any user input means text is no longer placeholder
        });
    
        this._innerText?.addEventListener('focus', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (this._isPlaceholderText) {  // Only clear if the text is still considered placeholder
                target.value = '';
            }
        });
    
        this._innerText?.addEventListener('blur', (event: Event) => {
            const target = event.target as HTMLInputElement;
            if (target.value.trim() === '') {
                target.value = this._placeHolder;  // Restore placeholder if nothing entered
                this._isPlaceholderText = true;  // Text is now a placeholder again
            }
        });
    }
    
    // [private helper methods]
}