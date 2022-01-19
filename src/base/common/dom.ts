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

export function formatSpan(text: string): string {
	return `<span>${text}</span>`;
}

