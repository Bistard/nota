import { HexColor } from "src/base/common/color";
import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Pair } from "src/base/common/util/type";

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
	mousedown = 'mousedown',
	mouseup = 'mouseup',
	mousemove = 'mousemove',
	doubleclick = 'dblclick',
	wheel = 'wheel',

	touchstart = 'touchstart',

	keydown = 'keydown',
	keyup = 'keyup',
	keypress = 'keypress',

	focus = 'focus',
	blur = 'blur',

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
	 * 
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
	 * 
	 * @note If the element is NOT in the DOM tree, the behaviour is undefined.
	 */
	export function getContentWidth(element: HTMLElement): number {
		const padding = getPaddingLeft(element) + getPaddingRight(element);
		const border  = getBorderLeft(element) + getBorderRight(element);
		return element.offsetWidth - padding - border;
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

	/**
	 * @description Determines if the given event is mouse right click.
	 */
	export function isMouseRightClick(event: UIEvent): boolean {
		return event instanceof MouseEvent && event.button === 2;
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
}