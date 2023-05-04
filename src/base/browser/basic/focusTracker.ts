import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { addDisposableListener, EventType } from "src/base/browser/basic/dom";
import { Emitter, Event, Register } from "src/base/common/event";

interface IFocusTracker extends IDisposable {

	/** 
	 * Fires when the element is focused. 
	 */
	onDidFocus: Register<void>;

	/** 
	 * Fires when the element is blured. 
	 */
	onDidBlur: Register<void>;

	/** 
	 * Fires when the component is either focused or blured (true represents 
	 * focused). 
	 */
	onDidFocusChange: Register<boolean>;

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

	private readonly _disposables = new DisposableManager();

	private readonly _element: HTMLElement;
	private _focused = false;
	private _loosingFocused = false;

	// [constructor]

	/**
	 * @param element The element to track.
	 * @param focusable If the element should be focusable when constructed.
	 */
	constructor(element: HTMLElement, focusable: boolean) {

		this._element = element;
		if (focusable) {
			this._element.tabIndex = 0;
		}

		this._disposables.register(addDisposableListener(element, EventType.focus, this.__onFocus.bind(this)));
		this._disposables.register(addDisposableListener(element, EventType.blur, this.__onBlur.bind(this)));
	}
	
	// [event]

	private readonly _onDidFocus = this._disposables.register(new Emitter<void>());
	public readonly onDidFocus: Register<void> = this._onDidFocus.registerListener;

	private readonly _onDidBlur = this._disposables.register(new Emitter<void>());
	public readonly onDidBlur: Register<void> = this._onDidBlur.registerListener;

	public readonly onDidFocusChange = Event.any([Event.map(this.onDidFocus, () => true), Event.map(this.onDidBlur, () => false)]);

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