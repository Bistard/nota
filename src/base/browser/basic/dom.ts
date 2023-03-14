import { FastElement } from "src/base/browser/basic/fastElement";
import { requestAtNextAnimationFrame } from "src/base/common/animation";
import { HexColor } from "src/base/common/color";
import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { Dimension } from "src/base/common/util/size";
import { Pair } from "src/base/common/util/type";

const BODY = document.body;
const DocElement = document.documentElement;

/**
 * @namespace DomStyle A series of types for DOM styling purpose.
 */
export namespace DomStyle {

	export type Position = 'static' | 'absolute' | 'fixed' | 'relative' | 'sticky' | 'initial' | 'inherit';
	export type Display = 'block' | 'compact' | 'flex' | 'inline' | 'inline-block' | 'inline-flex' | 'inline-table' | 'list-item' | 'marker' | 'none' | 'run-in' | 'table' | 'table-caption' | 'table-cell' | 'table-column' | 'table-column-group' | 'table-footer-group' | 'table-header-group' | 'table-row' | 'table-row-group' | 'initial' | 'inherit';
	export type FontWeight = 'normal' | 'lighter' | 'bold' | 'bolder' | 'initial' | 'inherit' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
	export type Visibility = 'visible' | 'hidden' | 'collapse' | 'initial' | 'inherit';
	export type Color<T extends string> = HexColor<T>;

}

/**
 * @readonly A enumeration of all HTMLElement event types.
 */
export const enum EventType {

	unhandledrejection = 'unhandledrejection',

	click = 'click',
	contextmenu = 'contextmenu',
	mouseover = 'mouseover',
	mouseout = 'mouseout',
	mouseenter = 'mouseenter',
	mouseleave = 'mouseleave',
	mousedown = 'mousedown',
	mouseup = 'mouseup',
	mousemove = 'mousemove',
	doubleclick = 'dblclick',
	wheel = 'wheel',

	touchstart = 'touchstart',
	touchmove = 'touchmove',
	touchend = 'touchend',
	touchcancel = 'touchcancel',

	keydown = 'keydown',
	keyup = 'keyup',
	keypress = 'keypress',

	focus = 'focus',
	blur = 'blur',
	resize = 'resize',

	focusin = 'focusin',
	focusout = 'focusout',

	drag = 'drag',
	dragstart = 'dragstart',
	dragend = 'dragend',
	dragover = 'dragover',
	dragenter = 'dragenter',
	dragleave = 'dragleave',
	drop = 'drop',
}

/**
 * @readonly Either displaying vertically or horizontally.
 */
export const enum Orientation {
    Horizontal,
    Vertical
}

/**
 * @description Given a `EventTarget` (eg. HTMLElement), we add a `eventType` 
 * listener to the target with the provided callback. The function returns a 
 * disposable to remove the listener.
 * 
 * @param domNode The target to be listening.
 * @param eventType The event type.
 * @param callback The callback function when the event happens.
 * @returns A disposable to remove the listener from the target.
 */
export function addDisposableListener<T extends keyof GlobalEventHandlersEventMap>(domNode: EventTarget, eventType: T, callback: (event: GlobalEventHandlersEventMap[T]) => void): IDisposable {
	domNode.addEventListener(eventType, callback as any);

	let disposed = false;

	return toDisposable(() => {
		if (disposed) {
			return;
		}

		if (!domNode) {
			return;
		}

		domNode.removeEventListener(eventType, callback as any);
		disposed = true;
	});
}

/**
 * @description Generates a string representation for HTML <span> label to display 
 * text.
 * @param text The text to be displeyed.
 * @returns The string representation of a <span> label.
 */
export function formatSpan(text: string): string {
	return `<span>${text}</span>`;
}

export type IStyleDisposable = IDisposable & {
	readonly style: HTMLStyleElement;
}

/**
 * Generates a {@link HTMLStyleElement} and appends to the given {@link HTMLElement}.
 * @param element The given HTMLElement.
 * @returns A disposable that will dispose the new created stylesheet from the 
 * given HTMLElement.
 * 
 * @note Optimized for 'screen' in media attribute.
 */
export function createStyleInCSS(element: HTMLElement): IStyleDisposable {
	const style = document.createElement('style');
	
	/**
	 * The media attribute specifies what media/device the target resource is 
	 * optimized for. 
	 * 		`screen`: Used for computer screens.
	 */
	style.media = 'screen';
	
	element.appendChild(style);
	return {
		dispose: () => element.removeChild(style),
		style: style,
	};
}

/**
 * @description A uitility namespace that contains all the helper functions 
 * relates to DOM.
 * 
 * @warn The size-related methods does NOT work for IE8 browser, see 
 * 	https://stackoverflow.com/questions/5227909/how-to-get-an-elements-padding-value-using-javascript AND
 * 	https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
 * 
 * @warn If the HTMLElement has not been added into the DOM tree, some methods
 * under the namespace will NOT work properly.
 */
export namespace DomUtility
{

	/**
	 * A template function to get the resired CSS property from a given element.
	 * @param element The HTMLElement.
	 * @param property The CSS properpty name.
	 * @returns The numerated resired property.
	 * 
	 * @warn If property cannot be convert to numerated form, -1 will be returned.
	 */
	function __getPropertyValue(element: HTMLElement, property: string): number {
		let computedStyle: CSSStyleDeclaration = getComputedStyle(element);
		let value = computedStyle.getPropertyValue(property);
		return parseFloat(value) || 0;
	}

	// [method - padding]

	export function getPaddingTop(element: HTMLElement): number {
		return __getPropertyValue(element, 'padding-top');
	}

	export function getPaddingBottom(element: HTMLElement): number {
		return __getPropertyValue(element, 'padding-bottom');
	}

	export function getPaddingLeft(element: HTMLElement): number {
		return __getPropertyValue(element, 'padding-left');
	}

	export function getPaddingRight(element: HTMLElement): number {
		return __getPropertyValue(element, 'padding-right');
	}

	// [method - border]

	export function getBorderTop(element: HTMLElement): number {
		return __getPropertyValue(element, 'border-top-width');
	}

	export function getBorderBottom(element: HTMLElement): number {
		return __getPropertyValue(element, 'border-bottom-width');
	}

	export function getBorderLeft(element: HTMLElement): number {
		return __getPropertyValue(element, 'border-left-width');
	}

	export function getBorderRight(element: HTMLElement): number {
		return __getPropertyValue(element, 'border-right-width');
	}

	// [method - margin]

	export function getMarginTop(element: HTMLElement): number {
		return __getPropertyValue(element, 'margin-top');
	}

	export function getMarginBottom(element: HTMLElement): number {
		return __getPropertyValue(element, 'margin-bottom');
	}

	export function getMarginLeft(element: HTMLElement): number {
		return __getPropertyValue(element, 'margin-left');
	}

	export function getMarginRight(element: HTMLElement): number {
		return __getPropertyValue(element, 'margin-right');
	}

	// [method - content]

	/**
	 * @description Get the height of the content excluding padding and border.
	 * @param element The HTMLElement.
	 * @note If the element is NOT in the DOM tree, the behaviour is undefined.
	 */
	export function getContentHeight(element: HTMLElement): number {
		const padding = getPaddingTop(element) + getPaddingBottom(element);
		const border  = getBorderTop(element) + getBorderBottom(element);
		return element.offsetHeight - padding - border;
	}

	/**
	 * @description Get the width of the content excluding padding and border.
	 * @param element The HTMLElement.
	 * @note If the element is NOT in the DOM tree, the behaviour is undefined.
	 */
	export function getContentWidth(element: HTMLElement): number {
		const padding = getPaddingLeft(element) + getPaddingRight(element);
		const border  = getBorderLeft(element) + getBorderRight(element);
		return element.offsetWidth - padding - border;
	}

	/**
	 * @description Get element top position relatives to the viewport.
	 * @param element The HTMLElement.
	 */
	export function getViewportTop(element: HTMLElement): number {
		const box = element.getBoundingClientRect();
		const scrollTop = window.pageYOffset || DocElement.scrollTop || BODY.scrollTop;
		const clientTop = DocElement.clientTop || BODY.clientTop || 0;
		const top  = box.top +  scrollTop - clientTop;
		return Math.round(top);
	}

	/**
	 * @description Get element left position relatives to the viewport.
	 * @param element The HTMLElement.
	 */
	export function getViewportLeft(element: HTMLElement): number {
		const box = element.getBoundingClientRect();
		const scrollLeft = window.pageXOffset || DocElement.scrollLeft || BODY.scrollLeft;
		const clientLeft = DocElement.clientLeft || BODY.clientLeft || 0;
		const left = box.left + scrollLeft - clientLeft;
		return Math.round(left);
	}

	// [method - click]

	/**
	 * @description Returns the relative click coordinates to the target element.
	 * @param event The {@link MouseEvent}.
	 * @param target The {@link EventTarget} we are relative with
	 */
	export function getRelativeClick(event: MouseEvent, target?: EventTarget): Pair<number, number> {
		let element = (target ?? event.currentTarget) as HTMLElement | null;
		if (element === null) {
			throw new Error('invalid event target');
		}
		let box: DOMRect = element.getBoundingClientRect();
		return [
			event.clientX - box.left,
			event.clientY - box.top
		];
	}

	// [method - type]

	/**
	 * @description Check if the given HTMLElement is considered as a input type.
	 */
	export function isInputElement(target: HTMLElement): boolean {
		return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
	}

	// [method - DOM]

	/**
	 * @description Determines if the given node is in the dom tree.
	 */
	export function ifInDomTree(node: Node): boolean {
		return node.isConnected;
	}

	/**
	 * @description Clears all the children DOM nodes from a provided node.
	 * @param node The parent DOM node.
	 * @returns The number of cleared nodes.
	 */
	export function clearChildrenNodes(node: HTMLElement): number {
		let cnt = 0;
		while (node.firstChild) {
			node.firstChild.remove();
			cnt++;
		}
		return cnt;
	}

	/**
	 * @description Removes the given node from its parent in DOM tree.
	 * @param node The given DOMElement.
	 */
	export function removeNodeFromParent(node: HTMLElement): void {
		if (node.parentElement) {
			node.parentElement.removeChild(node);
		}
	}

	/**
	 * @description Returns the dimension of the provided element.
	 */
	export function getClientDimension(element: HTMLElement): Dimension {
		// Try with DOM clientWidth / clientHeight
		if (element !== BODY) {
			return new Dimension(element.clientWidth, element.clientHeight);
		}

		// Try innerWidth / innerHeight
		if (window.innerWidth && window.innerHeight) {
			return new Dimension(window.innerWidth, window.innerHeight);
		}

		// Try with BODY.clientWidth / BODY.clientHeight
		if (BODY && BODY.clientWidth && BODY.clientHeight) {
			return new Dimension(BODY.clientWidth, BODY.clientHeight);
		}

		// Try with DocElement.clientWidth / DocElement.clientHeight
		if (DocElement && DocElement.clientWidth && DocElement.clientHeight) {
			return new Dimension(DocElement.clientWidth, DocElement.clientHeight);
		}

		throw new Error('Unable to figure out browser width and height');
	}

	export function setSize(element: HTMLElement, width: number | undefined, height: number | undefined): void {
		if (typeof width === 'number') {
			element.style.width = `${width}px`;
		}
	
		if (typeof height === 'number') {
			element.style.height = `${height}px`;
		}
	}

	export function setPosition(
		element: HTMLElement, 
		top: number | undefined, right: number | undefined, 
		bottom: number | undefined, left: number | undefined, 
		position: 'static' | 'absolute' | 'fixed' | 'relative' | 'sticky' | 'initial' | 'inherit',
	): void {
		if (typeof top === 'number') {
			element.style.top = `${top}px`;
		}
	
		if (typeof right === 'number') {
			element.style.right = `${right}px`;
		}
	
		if (typeof bottom === 'number') {
			element.style.bottom = `${bottom}px`;
		}
	
		if (typeof left === 'number') {
			element.style.left = `${left}px`;
		}
	
		element.style.position = position;
	}

	export function setFastSize<T extends HTMLElement>(element: FastElement<T>, width: number | undefined, height: number | undefined): void {
		if (typeof width === 'number') {
			element.setWidth(width);
		}
	
		if (typeof height === 'number') {
			element.setHeight(height);
		}
	}

	export function setFastPosition<T extends HTMLElement>(
		element: FastElement<T>, 
		top: number | undefined, right: number | undefined, 
		bottom: number | undefined, left: number | undefined, 
		position: 'static' | 'absolute' | 'fixed' | 'relative' | 'sticky' | 'initial' | 'inherit',
	): void {
		if (typeof top === 'number') {
			element.setTop(top);
		}
	
		if (typeof right === 'number') {
			element.setRight(right);
		}
	
		if (typeof bottom === 'number') {
			element.setBottom(bottom);
		}
	
		if (typeof left === 'number') {
			element.setLeft(left);
		}
	
		element.setPosition(position);
	}
}

/**
 * @description Check if the web envrionment (DOM content) has been loaded.
 * @returns A promise that will fullfilled when everything is loaded.
 */
export function waitDomToBeLoad(): Promise<unknown> {
	return new Promise<unknown>(resolve => {
		const readyState = document.readyState;
		if (readyState === 'complete' || (document && BODY !== null)) {
			resolve(undefined);
		} else {
			window.addEventListener('DOMContentLoaded', resolve, false);
		}
	});
}

/**
 * @description Continue requesting at next animation frame on the provided 
 * callback and returns a diposable to stop it.
 * @param animateFn The animation callback.
 */
export function requestAnimate(animateFn: () => void): IDisposable {
	let animateDisposable: IDisposable;

	const animation = () => {
		animateFn();
		animateDisposable = requestAtNextAnimationFrame(animation);
	};

	animateDisposable = requestAtNextAnimationFrame(animation);
	return animateDisposable;
}

/**
 * @class A Simple class for register callback on a given HTMLElement using an
 * {@link Emitter} instead of using raw *addEventListener()* method.
 */
export class DomEmitter<T> implements IDisposable {

    private emitter: Emitter<T>;
    private listener: IDisposable;

    get registerListener(): Register<T> {
        return this.emitter.registerListener;
    }

    constructor(element: EventTarget, type: EventType) {
        this.emitter = new Emitter();
        this.listener = addDisposableListener(element, type as any, (e: Event) => this.emitter.fire(e as any));
    }

    public dispose(): void {
        this.emitter.dispose();
        this.listener.dispose();
    }
}

/**
 * Provides a list of DOM event APIs.
 */
export interface IDomEvent<IfUseElement extends boolean> {
	
	onClick: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onDoubleclick: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMouseover: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMouseout: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMouseenter: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMouseleave: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
	
	onMousedown: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMouseup: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onMousemove: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
    
	onWheel: IfUseElement extends true
		? (element: HTMLElement, callback: (event: WheelEvent) => void) => IDisposable
		: (callback: (event: WheelEvent) => void) => IDisposable
	;
    
	onTouchstart: IfUseElement extends true
		? (element: HTMLElement, callback: (event: TouchEvent) => void) => IDisposable
		: (callback: (event: TouchEvent) => void) => IDisposable
	;
    
	onTouchmove: IfUseElement extends true
		? (element: HTMLElement, callback: (event: TouchEvent) => void) => IDisposable
		: (callback: (event: TouchEvent) => void) => IDisposable
	;
    
	onTouchend: IfUseElement extends true
		? (element: HTMLElement, callback: (event: TouchEvent) => void) => IDisposable
		: (callback: (event: TouchEvent) => void) => IDisposable
	;
    
	onTouchcancel: IfUseElement extends true
		? (element: HTMLElement, callback: (event: TouchEvent) => void) => IDisposable
		: (callback: (event: TouchEvent) => void) => IDisposable
	;
	
	onContextmenu: IfUseElement extends true
		? (element: HTMLElement, callback: (event: MouseEvent) => void) => IDisposable
		: (callback: (event: MouseEvent) => void) => IDisposable
	;
	
	onFocusin: IfUseElement extends true
		? (element: HTMLElement, callback: (event: FocusEvent) => void) => IDisposable
		: (callback: (event: FocusEvent) => void) => IDisposable
	;
	
	onFocusout: IfUseElement extends true
		? (element: HTMLElement, callback: (event: FocusEvent) => void) => IDisposable
		: (callback: (event: FocusEvent) => void) => IDisposable
	;
}

/**
 * An interface only for {@link BaseElement}.
 */
export interface IBaseElement extends IDomEvent<true>, IDisposable {
	// empty
}

/**
 * @class Simple class that encapsulates DOM event-related methods.
 */
export class BaseElement extends Disposable implements IBaseElement {

	constructor() {
		super();
	}

	public onClick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.click, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onDoubleclick(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.doubleclick, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseover(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseover, (e: MouseEvent) => {
            callback(e);
        }));
    }

	public onMouseout(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseout, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseenter(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseenter, (e: MouseEvent) => {
            callback(e);
        }));
    }

	public onMouseleave(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseleave, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousedown(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousedown, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMouseup(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mouseup, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onMousemove(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.mousemove, (e: MouseEvent) => {
            callback(e);
        }));
    }

    public onWheel(element: HTMLElement, callback: (event: WheelEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.wheel, (e: WheelEvent) => {
            callback(e);
        }));
    }

    public onTouchstart(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchstart, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchmove(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchmove, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchend(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchend, (e: TouchEvent) => {
            callback(e);
        }));
    }

    public onTouchcancel(element: HTMLElement, callback: (event: TouchEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.touchcancel, (e: TouchEvent) => {
            callback(e);
        }));
    }

	public onContextmenu(element: HTMLElement, callback: (event: MouseEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.contextmenu, (e: MouseEvent) => {
            callback(e);
        }));
    }

	public onFocusin(element: HTMLElement, callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.focusin, (e: FocusEvent) => {
            callback(e);
        }));
    }

	public onFocusout(element: HTMLElement, callback: (event: FocusEvent) => void): IDisposable {
        return this.__register(addDisposableListener(element, EventType.focusout, (e: FocusEvent) => {
            callback(e);
        }));
    }
}

export interface DomEventLike {
	preventDefault(): void;
	stopPropagation(): void;
}

export namespace DomEventHandler {

	export function stop<T extends DomEventLike>(event: T, stopBubble: boolean = false): T {
		event.preventDefault();
		if (stopBubble) {
			event.stopPropagation();
		}
		return event;
	}

	export function isLeftClick(event: MouseEvent): boolean {
		return event.button === 0;
	}

	export function isMiddleClick(event: MouseEvent): boolean {
		return event.button === 1;
	}

	export function isRightClick(event: MouseEvent): boolean {
		return event.button === 2;
	}

	// typically the browser back button
	export function isFourthClick(event: MouseEvent): boolean {
		return event.button === 3;
	}

	// typically the browser forward button
	export function isFifthClick(event: MouseEvent): boolean {
		return event.button === 4;
	}
}