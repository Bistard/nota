
/**
 * @class A simple tool class that controls the visibility of a provided DOM 
 * element.
 */
 export class VisibilityController {

    // [fields]

    private _dom: HTMLElement | undefined;
    private _visibleClassName: string;
    private _inVisibleClassName: string;
    private _fadeClassName?: string;

    /**
     * false: The DOM element is permanent invisible until this switch is on.
     * true: behaviour depends on `_visible`.
     */
    private _hardVisible: boolean;

    /**
     * false: hides the DOM with fading animation.
     * true: shows the DOM in a normal way.
     */
    private _visible: boolean;
    
    /**
     * inner boolean to remember if last time hiding is with fade or not.
     */
    private _fade: boolean;

    // [constructor]

    constructor(visibleClassName: string = 'visible', invisibleClassName: string = 'invisible', fadeClassName?: string) {
        this._visibleClassName = visibleClassName;
        this._inVisibleClassName = invisibleClassName;
        this._fadeClassName = fadeClassName;
        
        this._hardVisible = true;

        this._visible = false;
        this._fade = false;
    }

    // [methods]

    /**
     * @description Sets the DOM element controlled by the controller.
     * @param dom The DOM element.
     */
    public setDomNode(dom: HTMLElement): void {
        this._dom = dom;
    }

    /**
     * @description Sets to false will set the DOM as invisible without fading.
     * @param hardVisibility hard visibility.
     */
    public setHardVisibility(hardVisibility: boolean): void {
        if (this._hardVisible !== hardVisibility) {
            this._hardVisible = hardVisibility;
            this.__refreshVisibility();
        }
    }

    /**
     * @description Sets visibility to true or false with fading in or out animation.
     * @param visibility visibility.
     */
    public setVisibility(visibility: boolean) {
        this._visible = visibility;
        this.__refreshVisibility();
    }

    // [private helper methods]

    private __refreshVisibility(): void {
        // should not be seen, we set as invisible without fade out.
        if (this._hardVisible === false) {
            this._hide(false);
            return;
        }
        
        // should be visible, we display it
        if (this._visible) {
            this._show();
        } 
        
        // hide with fading animation
        else {
            this._hide(true);
        }

    }

    private _show(): void {
        this._dom!.classList.remove(this._inVisibleClassName);
        if (this._fade) {
            this._dom!.classList.remove(this._fadeClassName ? this._fadeClassName : 'fade');
        }

        this._dom!.classList.add(this._visibleClassName);
    }

    private _hide(fade: boolean): void {
        this._fade = fade;
        this._dom!.classList.remove(this._visibleClassName);
        
        if (fade) {
            this._dom!.classList.add(this._inVisibleClassName, this._fadeClassName ? this._fadeClassName : 'fade');
        } else {
            this._dom!.classList.add(this._inVisibleClassName);
        }
    }

}