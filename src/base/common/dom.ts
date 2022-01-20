import { IDisposable, toDisposable } from "src/base/common/dispose";

export interface IDimension {
    width: number;
    height: number;
}

export class Dimension implements IDimension {

	static readonly None = new Dimension(0, 0);

	constructor(
		public width: number,
		public height: number,
	) { }

	with(width: number = this.width, height: number = this.height): Dimension {
		if (width !== this.width || height !== this.height) {
			return new Dimension(width, height);
		} else {
			return this;
		}
	}

	static is(obj: unknown): obj is IDimension {
		return typeof obj === 'object' && typeof (<IDimension>obj).height === 'number' && typeof (<IDimension>obj).width === 'number';
	}

	static lift(obj: IDimension): Dimension {
		if (obj instanceof Dimension) {
			return obj;
		} else {
			return new Dimension(obj.width, obj.height);
		}
	}

	static equals(a: Dimension | undefined, b: Dimension | undefined): boolean {
		if (a === b) {
			return true;
		}
		if (!a || !b) {
			return false;
		}
		return a.width === b.width && a.height === b.height;
	}
}

/**
 * @readonly A enumeration of all HTMLElement event types.
 */
export enum EventType {
	click = 'click',
	contextmenu = 'contextmenu',
	mouseover = 'mouseover',
	mouseout = 'mouseout',
	mousedown = 'mousedown',
	mouseup = 'mouseup',
	mousemove = 'mousemove',
	doubleclick = 'dblclick'
}

/**
 * @readonly Either displaying vertically or horizontally.
 */
export enum Orientation {
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
export function addDisposableListener(domNode: EventTarget, eventType: string, callback: (event: any) => void): IDisposable {
	domNode.addEventListener(eventType, callback);

	let disposed = false;

	return toDisposable(() => {
		if (disposed) {
			return;
		}

		domNode.removeEventListener(eventType, callback);
		disposed = true;
	});
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
 * @description Generates a string representation for HTML <span> label to display 
 * text.
 * @param text The text to be displeyed.
 * @returns The string representation of a <span> label.
 */
export function formatSpan(text: string): string {
	return `<span>${text}</span>`;
}

/**
 * @description A uitility namespace that contains all the helper functions to 
 * get the size-related attributes from a DOM element.
 * 
 * @warn The namespace does NOT work for IE8 browser, see 
 * 	https://stackoverflow.com/questions/5227909/how-to-get-an-elements-padding-value-using-javascript AND
 * 	https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle
 */
export namespace DOMSize
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
		return parseFloat(value) || -1;
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
	 */
	export function getContentHeight(element: HTMLElement): number {
		const padding = getPaddingTop(element) + getPaddingBottom(element);
		const border  = getBorderTop(element) + getBorderBottom(element);
		return element.offsetHeight - padding - border;
	}

	/**
	 * @description Get the width of the content excluding padding and border.
	 * @param element The HTMLElement.
	 */
	 export function getContentWidth(element: HTMLElement): number {
		const padding = getPaddingLeft(element) + getPaddingRight(element);
		const border  = getBorderLeft(element) + getBorderRight(element);
		return element.offsetWidth - padding - border;
	}

}