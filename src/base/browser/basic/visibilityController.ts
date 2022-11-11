
/**
 * @class A simple tool class that controls the visibility of a provided DOM 
 * element.
 */
 export class VisibilityController {

    // [fields]

    private _dom: HTMLElement | undefined;
    private _visibleClass: string;
    private _invisibleClass: string;
    private _fadeClass?: string;

    /**
     * false: hides the DOM with fading animation.
     * true: shows the DOM in a normal way.
     */
    private _visible: boolean;
    
    // [constructor]

    constructor(visibleClass = 'visible', invisibleClass = 'invisible', fadeClassName?: string /** 'fade' */, defaultVisibility = true) {
        this._visibleClass = visibleClass;
        this._invisibleClass = invisibleClass;
        this._fadeClass = fadeClassName;
        this._visible = defaultVisibility;
    }

    // [methods]

    /**
     * @description Sets the DOM element controlled by the controller.
     * @param dom The DOM element.
     */
    public setDomNode(dom: HTMLElement): void {
        this._dom = dom;
        if (this._dom && this._fadeClass) {
            this.toggleFade(true);
        }
        this.__refreshVisibility();
    }

    /**
     * @description Toggles if the element should fade between states.
     * @param val If sets to fade.
     * @param fadeClass The optional updated fade class.
     */
    public toggleFade(val: boolean, fadeClass?: string): void {
        this._fadeClass = fadeClass;
        
        if (this._dom && this._fadeClass) {
            this._dom.classList.toggle(this._fadeClass, val);
        }
    }

    /**
     * @description Sets the visibility of the DOM element.
     * @param visibility visibility.
     */
    public setVisibility(visibility: boolean) {
        if (this._visible !== visibility) {
            this._visible = visibility;
            this.__refreshVisibility();
        }
    }

    // [private helper methods]

    private __refreshVisibility(): void {
        if (this._visible) {
            this.__show();
        } else {
            this.__hide();
        }
    }

    private __show(): void {
        if (!this._dom) {
            return;
        }
        this._dom.classList.remove(this._invisibleClass);
        this._dom.classList.add(this._visibleClass);
    }

    private __hide(): void {
        if (!this._dom) {
            return;
        }
        this._dom.classList.remove(this._visibleClass);
        this._dom.classList.add(this._invisibleClass);
    }
}