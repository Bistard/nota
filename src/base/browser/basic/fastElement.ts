import { HexColor } from "src/base/common/color";
import { DomStyle } from "src/base/common/dom";

/**
 * The interface only for {@link FastElement}.
 */
export interface IFastElement<T> {

    readonly element: T;

    setWidth(value: number): void;
    setHeight(value: number): void;
    
    setPosition(value: DomStyle.Position): void;
    setDisplay(value: DomStyle.Display): void;

    setTop(value: number): void;
    setBottom(value: number): void;
    setLeft(value: number): void;
    setRight(value: number): void;

    setClassName(value: string): void;
    toggleClassName(value: string): void;

    setFontSize(value: number): void;
    setFontWeight(value: DomStyle.FontWeight): void;
    setFontFamily(value: string): void;

    setLineHeight(value: number): void;
    setVisibility(value: DomStyle.Visibility): void;
    setBackgroundColor<K extends string>(value: HexColor<K>): void;

}

/**
 * @class Wrapper class for {@link HTMLElement}. The class costs a little extra
 * memory to reduce some unnecessary rendering process.
 * 
 * Essentially, {@link FastElement} stores a copy of the DOM attributes in the
 * memory. If the incoming rendering value is the same in the memory, we ignore 
 * the request to avoid repeating renderng.
 * 
 * @note The unit for number is always pixels.
 * 
 * @readonly The idea is learned from Visual Studio Code.
 */
export class FastElement<T extends HTMLElement> implements IFastElement<T> {

    // [field]

    /** The actual {@link HTMLElement}. */
    private readonly _element: T;
    
    /** 
     * Representing the DOM attributes of the wrapped HTMLElement. Initially are
     * sets to nothing:
     *      {@link number} -> -1
     *      {@link string} -> ''
     */

    private _width: number = -1;
    private _height: number = -1;
    
    private _position: DomStyle.Position | '' = '';
    private _display: DomStyle.Display | '' = '';

    private _top: number = -1;
    private _bottom: number = -1;
    private _left: number = -1;
    private _right: number = -1;

    private _className: string = '';

    private _fontSize: number = -1;
    private _fontWeight: DomStyle.FontWeight | '' = '';
    private _fontFamily: string = '';

    private _lineHeight: number = -1;
    private _visibility: DomStyle.Visibility | '' = '';
    private _backgroundColor: string = '';

    // [constructor]

    constructor(element: T) {
        this._element = element;
    }

    // [getter]

    get element(): Readonly<T> { return this._element; }

    // [public methods]

    public setWidth(value: number): void {
        if (this._width === value) {
            return;
        }
        this._width = value;
        this._element.style.width = `${value}px`;
    }

    public setHeight(value: number): void {
        if (this._height === value) {
            return;
        }
        this._height = value;
        this._element.style.height = `${value}px`;
    }

    public setPosition(value: DomStyle.Position): void {
        if (this._position === value) {
            return;
        }
        this._position = value;
        this._element.style.position = value;
    }

    public setDisplay(value: DomStyle.Display): void {
        if (this._display === value) {
            return;
        }
        this._display = value;
        this._element.style.display = value;
    }

    public setClassName(value: string): void {
        if (this._className === value) {
            return;
        }
        this._className = value;
        this._element.className = value;
    }

    public setTop(value: number): void {
        if (this._top === value) {
            return;
        }
        this._top = value;
        this._element.style.top = `${value}px`;
    }

    public setBottom(value: number): void {
        if (this._bottom === value) {
            return;
        }
        this._bottom = value;
        this._element.style.bottom = `${value}px`;
    }

    public setLeft(value: number): void {
        if (this._left === value) {
            return;
        }
        this._left = value;
        this._element.style.left = `${value}px`;
    }

    public setRight(value: number): void {
        if (this._right === value) {
            return;
        }
        this._right = value;
        this._element.style.right = `${value}px`;
    }

    public toggleClassName(value: string, force?: boolean): void {
        this._element.classList.toggle(value, force);
        this._className = value;
    }

    public setFontSize(value: number): void {
        if (this._fontSize === value) {
            return;
        }
        this._fontSize = value;
        this._element.style.fontSize = `${value}px`;
    }

    public setFontWeight(value: DomStyle.FontWeight): void {
        if (this._fontWeight === value) {
            return;
        }
        this._fontWeight = value;
        this._element.style.fontWeight = value;
    }

    public setFontFamily(value: string): void {
        if (this._fontFamily === value) {
            return;
        }
        this._fontFamily = value;
        this._element.style.fontFamily = value;
    }

    public setLineHeight(value: number): void {
        if (this._lineHeight === value) {
            return;
        }
        this._lineHeight = value;
        this._element.style.lineHeight = `${value}px`;
    }

    public setVisibility(value: DomStyle.Visibility): void {
        if (this._visibility === value) {
            return;
        }
        this._visibility = value;
        this._element.style.visibility = value;
    }

    public setBackgroundColor<K extends string>(value: HexColor<K>): void {
        if (this._backgroundColor === value) {
            return;
        }
        this._backgroundColor = value;
        this._element.style.backgroundColor = value;
    }
    
}
