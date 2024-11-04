import { addDisposableListener, DomStyle, EventType, IDomEvent } from "src/base/browser/basic/dom";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { check } from "src/base/common/utilities/panic";
import { isObject } from "src/base/common/utilities/type";

/**
 * The interface only for {@link FastElement}.
 */
export interface IFastElement<T extends HTMLElement> extends IDomEvent<false> {

    readonly raw: T;

    setID(id: string): void;
    getID(): string;

    setWidth(value: number): void;
    setHeight(value: number): void;
    
    setPosition(value: DomStyle.Position): void;
    setDisplay(value: DomStyle.Display): void;

    setFocus(): void;
    setBlur(): void;
    setTabIndex(value: number): void;
    setZIndex(value: number): void;

    setTop(value: number): void;
    setBottom(value: number): void;
    setLeft(value: number): void;
    setRight(value: number): void;

    setClassName(value: string): void;
    toggleClassName(value: string): void;
    addClassList(...values: string[]): void;
    removeClassList(...values: string[]): void;

    setFontSize(value: number): void;
    setFontWeight(value: DomStyle.FontWeight): void;
    setFontFamily(value: string): void;

    setLineHeight(value: number): void;
    setVisibility(value: DomStyle.Visibility): void;
    setOpacity(value: number): void;
    setPointerEvents(value: 'auto' | 'none'): void;
    setBackgroundColor<K extends string>(value: DomStyle.Color<K>): void;

    setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;

	appendChild(child: IFastElement<T> | T): void;
	removeChild(child: IFastElement<T> | T): void;
}

/**
 * @class Wrapper class for {@link HTMLElement}. The class costs a little extra
 * memory to reduce some unnecessary rendering process.
 * 
 * Essentially, {@link FastElement} stores a copy of the DOM attributes in the
 * memory. If the incoming rendering value is the same in the memory, we ignore 
 * the request to avoid repeating rendering.
 * 
 * @note The unit for number is always pixels.
 */
export class FastElement<T extends HTMLElement> extends Disposable implements IFastElement<T> {

    // [field]

    /** The actual {@link HTMLElement}. */
    public readonly raw: T;
    
    // Representing the DOM attributes of the wrapped HTMLElement. Initially are
    // sets to nothing:
    //     {@link number} -> -1
    //     {@link string} -> ''
    
    private _width: number = -1;
    private _height: number = -1;

    private _minWidth: number = -1;
    private _minHeight: number = -1;
    
    private _position: DomStyle.Position | '' = '';
    private _display: DomStyle.Display | '' = '';

    private _tabIndex: number = -1;
    private _zIndex: number = -1;
    
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
    private _opacity: number = -1;
    private _pointerEvents: 'auto' | 'none' = 'auto';
    private _backgroundColor: string = '';

    // [constructor]

    constructor(element: T) {
        super();
        this.raw = element;
    }

    // [public methods]

    public setID(id: string): void {
        this.raw.id = id;
    }
    
    public getID(): string {
        return this.raw.id;
    }

    public setWidth(value: number): void {
        if (this._width === value) {
            return;
        }
        this._width = value;
        this.raw.style.width = `${value}px`;
    }

    public setMinWidth(value: number): void {
        if (this._minWidth === value) {
            return;
        }
        this._minWidth = value;
        this.raw.style.minWidth = `${value}px`;
    }

    public setHeight(value: number): void {
        if (this._height === value) {
            return;
        }
        this._height = value;
        this.raw.style.height = `${value}px`;
    }

    public setMinHeight(value: number): void {
        if (this._minHeight === value) {
            return;
        }
        this._minHeight = value;
        this.raw.style.minHeight = `${value}px`;
    }

    public setPosition(value: DomStyle.Position): void {
        if (this._position === value) {
            return;
        }
        this._position = value;
        this.raw.style.position = value;
    }

    public setDisplay(value: DomStyle.Display): void {
        if (this._display === value) {
            return;
        }
        this._display = value;
        this.raw.style.display = value;
    }

    public setFocus(): void {
        this.raw.focus();
    }

    public setBlur(): void {
        this.raw.blur();
    }

    public setTabIndex(value: number): void {
        if (this._tabIndex === value) {
            return;
        }
        this._tabIndex = value;
        this.raw.tabIndex = value;
    }

    public setZIndex(value: number): void {
        if (this._zIndex === value) {
            return;
        }
        this._zIndex = value;
        this.raw.style.zIndex = `${value}`;
    }

    public setTop(value: number): void {
        if (this._top === value) {
            return;
        }
        this._top = value;
        this.raw.style.top = `${value}px`;
    }

    public setBottom(value: number): void {
        if (this._bottom === value) {
            return;
        }
        this._bottom = value;
        this.raw.style.bottom = `${value}px`;
    }

    public setLeft(value: number): void {
        if (this._left === value) {
            return;
        }
        this._left = value;
        this.raw.style.left = `${value}px`;
    }

    public setRight(value: number): void {
        if (this._right === value) {
            return;
        }
        this._right = value;
        this.raw.style.right = `${value}px`;
    }

    public setClassName(value: string): void {
        if (this._className === value) {
            return;
        }
        this._className = value;
        this.raw.className = value;
    }

    public toggleClassName(value: string, force?: boolean): void {
        this.raw.classList.toggle(value, force);
    }

    public addClassList(...values: string[]): void {
        this.raw.classList.add(...values);
    }

    public removeClassList(...values: string[]): void {
        this.raw.classList.remove(...values);
    }

    public setFontSize(value: number): void {
        if (this._fontSize === value) {
            return;
        }
        this._fontSize = value;
        this.raw.style.fontSize = `${value}px`;
    }

    public setFontWeight(value: DomStyle.FontWeight): void {
        if (this._fontWeight === value) {
            return;
        }
        this._fontWeight = value;
        this.raw.style.fontWeight = value;
    }

    public setFontFamily(value: string): void {
        if (this._fontFamily === value) {
            return;
        }
        this._fontFamily = value;
        this.raw.style.fontFamily = value;
    }

    public setLineHeight(value: number): void {
        if (this._lineHeight === value) {
            return;
        }
        this._lineHeight = value;
        this.raw.style.lineHeight = `${value}px`;
    }

    public setVisibility(value: DomStyle.Visibility): void {
        if (this._visibility === value) {
            return;
        }
        this._visibility = value;
        this.raw.style.visibility = value;
    }

    public setOpacity(value: number): void {
        check(0 <= value && value <= 1);
        if (this._opacity === value) {
            return;
        }
        this._opacity = value;
        this.raw.style.opacity = `${value}`;
    }

    public setPointerEvents(value: 'auto' | 'none'): void {
        if (this._pointerEvents === value) {
            return;
        }
        this._pointerEvents = value;
        this.raw.style.pointerEvents = `${value}`;
    }

    public setBackgroundColor<K extends string>(value: DomStyle.Color<K>): void {
        if (this._backgroundColor === value) {
            return;
        }
        this._backgroundColor = value;
        this.raw.style.backgroundColor = value;
    }

    public setAttribute(name: string, value: string): void {
		this.raw.setAttribute(name, value);
	}

	public removeAttribute(name: string): void {
		this.raw.removeAttribute(name);
	}

	public appendChild(child: IFastElement<T> | T): void {
		if (isFastElement(child)) {
            this.raw.appendChild(child.raw);
        } else {
            this.raw.appendChild(child);
        }
	}

	public removeChild(child: IFastElement<T> | T): void {
		if (isFastElement(child)) {
            this.raw.removeChild(child.raw);
        } else {
            this.raw.removeChild(child);
        }
	}

    public onClick(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.click, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onDoubleClick(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.doubleClick, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseover(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mouseover, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseout(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mouseout, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseenter(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mouseenter, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseleave(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mouseleave, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousedown(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mousedown, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseup(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mouseup, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousemove(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.mousemove, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onWheel(callback: (event: WheelEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.wheel, (e: WheelEvent) => {
            callback(e);
        }));
    }

    public onTouchstart(callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.touchstart, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchmove(callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.touchmove, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchend(callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.touchend, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchcancel(callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.touchcancel, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onContextmenu(callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.contextmenu, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onFocusin(callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.focusin, (e: FocusEvent) => {
            callback(e);
        }));
    }

	public onFocusout(callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.focusout, (e: FocusEvent) => {
            callback(e);
        }));
    }

    public onFocus(callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.focus, (e: FocusEvent) => {
            callback(e);
        }));
    }

	public onBlur(callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(this.raw, EventType.blur, (e: FocusEvent) => {
            callback(e);
        }));
    }

    public onKeydown(callback: (event: KeyboardEvent) => void): IDisposable {
		return this.__register(addDisposableListener(this.raw, EventType.keydown, (e: KeyboardEvent) => {
            callback(e);
        }));
	}

	public onKeyup(callback: (event: KeyboardEvent) => void): IDisposable {
		return this.__register(addDisposableListener(this.raw, EventType.keyup, (e: KeyboardEvent) => {
            callback(e);
        }));
	}

    public override dispose(): void {
        this.raw.remove();
        super.dispose();
    }
}

export function isFastElement<T extends HTMLElement>(obj: any): obj is IFastElement<T> {
    if (isObject(obj) && ((<IFastElement<T>>obj).raw)) {
        return true;
    }
    return false;
}
