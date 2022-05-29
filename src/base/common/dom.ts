import { DisposableManager, IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { Pair } from "src/base/common/type";

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
 * @description Generates a string representation for HTML <span> label to display 
 * text.
 * @param text The text to be displeyed.
 * @returns The string representation of a <span> label.
 */
export function formatSpan(text: string): string {
	return `<span>${text}</span>`;
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

}

interface IFocusTracker extends IDisposable {

	/** Fires when the element is focused. */
	onDidFocus: Register<void>;

	/** Fires when the element is blured. */
	onDidBlur: Register<void>;

	/**
	 * @description Sets the element as focusable or non-focusable.
	 */
	setFocusable(value: boolean): void;
}

/**
 * @class A tool that tracks / sets the focus status of the given DOM element.
 */
export class FocusTracker implements IFocusTracker, IDisposable {

	// [field]

	private _disposables = new DisposableManager();

	private _element: HTMLElement;
	private _focused = false;
	private _loosingFocused = false;

	// [constructor]

	constructor(element: HTMLElement, focusable: boolean) {

		this._element = element;
		if (focusable) {
			this._element.tabIndex = 0;
		}

		this._disposables.register(addDisposableListener(element, EventType.focus, this.__onFocus));
		this._disposables.register(addDisposableListener(element, EventType.blur, this.__onBlur));

	}
	
	// [event]

	private readonly _onDidFocus = this._disposables.register(new Emitter<void>());
	public readonly onDidFocus: Register<void> = this._onDidFocus.registerListener;

	private readonly _onDidBlur = this._disposables.register(new Emitter<void>());
	public readonly onDidBlur: Register<void> = this._onDidBlur.registerListener;

	// [public method]

	public setFocusable(value: boolean): void {
		if (value) {
			this._element.tabIndex = 0;
		} else {
			this._element.tabIndex = -1;
		}
	}

	public dispose(): void {
		this._disposables.dispose();
	}

	// [private heleper methods]

	private __onFocus(): void {
		this._loosingFocused = false;
		if (this._focused === false) {
			this._focused = true;
			this._onDidFocus.fire();
		}
	}

	private __onBlur(): void {
		if (this._focused) {
			this._loosingFocused = true;
			window.setTimeout(() => {
				if (this._loosingFocused) {
					this._loosingFocused = false;
					this._focused = false;
					this._onDidBlur.fire();
				}
			}, 0);
		}
	}

}