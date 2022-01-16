import * as animation from "src/base/common/animation";
import { IDisposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";

export interface IScrollEvent {
    isSmoothScrolling: boolean;

	oldWidth: number;
	oldScrollWidth: number;
	oldScrollLeft: number;

	width: number;
	scrollWidth: number;
	scrollLeft: number;

	oldHeight: number;
	oldScrollHeight: number;
	oldScrollTop: number;

	height: number;
	scrollHeight: number;
	scrollTop: number;
}

export interface IScrollDimension {
	readonly width: number;
	readonly scrollWidth: number;
	readonly height: number;
	readonly scrollHeight: number;
}

export interface INewScrollDimension {
	width?: number;
	scrollWidth?: number;
	height?: number;
	scrollHeight?: number;
}

export interface IScrollPosition {
	readonly scrollLeft: number;
    readonly scrollTop: number;
}

export interface INewScrollPosition {
    scrollLeft?: number;
    scrollTop?: number;
}

export interface ISmoothScrollPosition extends IScrollPosition {
    readonly width: number;
	readonly height: number;
}

export interface ISmoothScrollingStatus {
    readonly scrollLeft: number;
	readonly scrollTop: number;
	readonly isDone: boolean;
}

/**
 * @class A simple class for storing the information of {@link Scrollable} 
 * related number and provides methods for easy modifying numbers and generating 
 * new numbers.
 */
export class ScrollStatus {

	// [fields]
	
	public readonly width: number;        // 
	public readonly scrollWidth: number;  // 
	public readonly scrollLeft: number;   // 
	public readonly height: number;       // 
	public readonly scrollHeight: number; // 
	public readonly scrollTop: number;    // 

	// [constructor]

    constructor(
		width: number,  scrollWidth: number,  scrollLeft: number,
		height: number, scrollHeight: number, scrollTop: number
	) {
		this.width = width;
		this.scrollWidth = scrollWidth;
		this.scrollLeft = scrollLeft;
		this.height = height;
		this.scrollHeight = scrollHeight;
		this.scrollTop = scrollTop;
    }

	// [methods]

	public equal(other: ScrollStatus): boolean {
		return (
			this.width === other.width
			&& this.scrollWidth === other.scrollWidth
			&& this.scrollLeft === other.scrollLeft
			&& this.height === other.height
			&& this.scrollHeight === other.scrollHeight
			&& this.scrollTop === other.scrollTop
		);
	}

	public withDimension(update: INewScrollDimension): ScrollStatus {
		return new ScrollStatus(
			(typeof update.width !== 'undefined' ? update.width : this.width),
			(typeof update.scrollWidth !== 'undefined' ? update.scrollWidth : this.scrollWidth),
			this.scrollLeft,
			(typeof update.height !== 'undefined' ? update.height : this.height),
			(typeof update.scrollHeight !== 'undefined' ? update.scrollHeight : this.scrollHeight),
			this.scrollTop
		);
	}

	public withPosition(update: INewScrollPosition): ScrollStatus {
		return new ScrollStatus(
			this.width,
			this.scrollWidth,
			update.scrollLeft ? update.scrollLeft : 0,
			this.height,
			this.scrollHeight,
			update.scrollTop ? update.scrollTop : 0
		);
	}
}

export interface IAnimation {
	(completion: number): number;
}

/**
 * @class Simulates the animation when scrolling smoothly.
 */
export class SmoothScrollAnimation implements IDisposable {

	// [fields]

    // starting scrolling position
    public readonly from: ISmoothScrollPosition;
	
    // ending scrolling position (maybe changed during scrolling)
    public to: ISmoothScrollPosition;
	
    // the duration of the whole scroll animation
    public readonly duration: number;
	
    // the begin time when scrolling
    public readonly begintime: number;

    // this is the handle created when the animation starts. 0 means no handles.
    public animationHandle: number;

	// the helper function to do the actual scroll horizontally
    private _scrollLeft!: IAnimation;

	// the helper function to do the actual scroll vertically
	private _scrollTop!: IAnimation;

	// [Constructor]
    constructor(
		from	 : ISmoothScrollPosition, 
		to		 : ISmoothScrollPosition, 
		begintime: number, 
		duration : number
	) {
        this.from = from;
        this.to = to;
        this.begintime = begintime;
        this.duration = duration;
        this.animationHandle = 0;

        this.__initAnimations();
    }

	// [methods]

    public dispose(): void {
        if (this.animationHandle !== 0) {
            animation.cancelAnimationFrame(this.animationHandle);
            this.animationHandle = 0;
        }
    }

	/**
	 * @description Do the actual scrolling motion for the next animation frame.
	 * 
	 * @param now The current time, if not given, with default Date.now() will 
	 * be invoked.
	 * @returns The updated status for the current scrolling motion.
	 * @note Will not modify the actual status, only returns a new created one.
	 */
    public tick(now?: number): ISmoothScrollingStatus {
		now = (typeof now === 'undefined' ? Date.now() : now);

        const completion = (now - this.begintime) / this.duration;

		if (completion < 1) {
			const newScrollLeft = this._scrollLeft(completion);
			const newScrollTop = this._scrollTop(completion);
			return {
                scrollLeft: newScrollLeft, 
                scrollTop: newScrollTop, 
                isDone: false
            };
		}

		return {
            scrollLeft: this.to.scrollLeft, 
            scrollTop: this.to.scrollTop, 
            isDone: true
        };
	}

	public setDimension(update: ScrollStatus): void {
		this.to = update.withPosition(this.to);
		this.__initAnimations();
	}

	public static start(
		from	: ISmoothScrollPosition, 
		to		: ISmoothScrollPosition, 
		duration: number): SmoothScrollAnimation 
	{
		// +10 / -10 : pretend the animation already started for a quicker response to a scroll request
		duration = duration + 10;
		const startTime = Date.now() - 10;
		return new SmoothScrollAnimation(from, to, startTime, duration);
	}

    private __initAnimations(): void {
        this._scrollLeft = this.__initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width);
		this._scrollTop = this.__initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
    }

    private __initAnimation(from: number, to: number, viewportSize: number): IAnimation {
        const delta = Math.abs(from - to);
		if (delta > 2.5 * viewportSize) {
			let stop1: number, stop2: number;
			if (from < to) {
				// scroll to 75% of the viewportSize
				stop1 = from + 0.75 * viewportSize;
				stop2 = to - 0.75 * viewportSize;
			} else {
				stop1 = from - 0.75 * viewportSize;
				stop2 = to + 0.75 * viewportSize;
			}
			return __createComposed(__createEaseOutCubic(from, stop1), __createEaseOutCubic(stop2, to), 0.33);
		}
		return __createEaseOutCubic(from, to);
    }
}

// [private helper functions]

function __easeInCubic(t: number): number {
	return Math.pow(t, 3);
}

function __easeOutCubic(t: number): number {
	return 1 - __easeInCubic(1 - t);
}

function __createEaseOutCubic(from: number, to: number): IAnimation {
	const delta = to - from;
	return function (completion: number): number {
		return from + delta * __easeOutCubic(completion);
	};
}

function __createComposed(a: IAnimation, b: IAnimation, cut: number): IAnimation {
	return function (completion: number): number {
		if (completion < cut) {
			return a(completion / cut);
		}
		return b((completion - cut) / (1 - cut));
	};
}

// [end]

/**
 * @description {@link Scrollable} is a pure abstract class that simulates the
 * logic of a scrollable item. Other classes need to listen to the `onDidScroll()` 
 * event to make reaction when scrolling.
 */
export class Scrollable implements IDisposable {

	// [fields]

    // stores all the number related data for scrolling
    private _status: ScrollStatus;
    
	// the duration that the animation is about to take
    private _smoothScrollDuration: number;
    
	// the smooth scrolling animation
    private _smoothScrolling: SmoothScrollAnimation | null;

    // event fires when scrolling happens
    private _onDidScroll = new Emitter<IScrollEvent>();
	public readonly onDidScroll = this._onDidScroll.registerListener;

	// [constructor]

    constructor(smoothScrollDuration: number) {
        this._status = new ScrollStatus(0, 0, 0, 0, 0, 0);
        this._smoothScrollDuration = smoothScrollDuration;
        this._smoothScrolling = null;
    }

	// [method]

	/**
	 * @description Disposes the events and ongoing smooth scroll animation.
	 */
    public dispose(): void {
		if (this._smoothScrolling) {
			this._smoothScrolling.dispose();
			this._smoothScrolling = null;
		}
		this._onDidScroll.dispose();
	}

	/**
	 * @description Returns the current scroll position.
	 * 
     * @note This result might be an intermediate scroll position, as there might 
     * be an ongoing smooth scroll animation.
	 */
	 public getCurrentPosition(): IScrollPosition {
		return this._status;
	}

	/**
	 * @description Returns the dimension of the scrollable.
	 * 
	 * @returns The dimension of the scrollable.
	 */
	public getDimension(): IScrollDimension {
		return this._status;
	}

	/**
	 * @description Returns the expected scroll position after the animation. If
	 * no animation is ongoing, returns the current position.
	 * 
	 * @returns The position of the future scroll position.
	 */
	public getFuturePosition(): IScrollPosition {
		if (this._smoothScrolling) {
			return this._smoothScrolling.to;
		}
		return this._status;
	}

	/**
	 * @description TODO
	 */
	public setDimension(dimension: INewScrollDimension): void {
		const newState = this._status.withDimension(dimension);
		this.__setStatus(newState, this._smoothScrolling ? true : false);

		// Validate outstanding animated scroll position target
		if (this._smoothScrolling) {
			this._smoothScrolling.setDimension(this._status);
		}
	}

	/**
	 * @description 
	 */
	public setScrollPositionAbsolute(update: INewScrollPosition): void {

		const newStatus = this._status.withPosition(update);

		// if a smooth scrolling is ongoing, we terminate it
		if (this._smoothScrolling) {
			this._smoothScrolling.dispose();
			this._smoothScrolling = null;
		}

		this.__setStatus(newStatus, false);
	}

	/**
	 * @description 
	 */
	public setScrollPositionSmoothly(update: INewScrollPosition): void {
		
		// this scrollable does not support smooth scrolling animation
		if (this._smoothScrollDuration === 0) {
			return this.setScrollPositionAbsolute(update);
		}

		// if an animation is ongoing, we create a new animation for overriding.
		if (this._smoothScrolling) {
			
			// Combine our pending scrollLeft/scrollTop with incoming scrollLeft/scrollTop
			update = {
				scrollLeft: (typeof update.scrollLeft === 'undefined' ? this._smoothScrolling.to.scrollLeft : update.scrollLeft),
				scrollTop: (typeof update.scrollTop === 'undefined' ? this._smoothScrolling.to.scrollTop : update.scrollTop)
			};

			// update
			const newStatus = this._status.withPosition(update);

			// No need to interrupt or extend the current animation since we're going to the same place
			if (this._smoothScrolling.to.scrollLeft === newStatus.scrollLeft && 
				this._smoothScrolling.to.scrollTop === newStatus.scrollTop
			) {
				return;
			}

			// create a new animation to override the old one
			const newSmoothScrolling = new SmoothScrollAnimation(
					this._smoothScrolling.from, 
					newStatus, 
					this._smoothScrolling.begintime, 
					this._smoothScrolling.duration
			);
			this._smoothScrolling.dispose();
			this._smoothScrolling = newSmoothScrolling;
		} 
		
		// if no animations ongoing, we create a new one.
		else {
			// update
			const newStatus = this._status.withPosition(update);

			// create a new animation
			this._smoothScrolling = SmoothScrollAnimation.start(this._status, newStatus, this._smoothScrollDuration);
		}

		// finally starts running animation
		this._smoothScrolling.animationHandle = animation.requestAnimationFrame(() => {
			// it is possible animation gets cancelled before the next frame
			if (!this._smoothScrolling) {
				return;
			}

			// perform the actual animation
			animation.cancelAnimationFrame(this._smoothScrolling.animationHandle);
			this.__doScrollSmoothly();
		});
	}

	/**
	 * @description 
	 */
	private __doScrollSmoothly(): void {
		if (!this._smoothScrolling) {
			return;
		}

		const update = this._smoothScrolling.tick();
		const newState = this._status.withPosition(update);

		this.__setStatus(newState, true);

		if (!this._smoothScrolling) {
			// scroll animation was cancelled by the event listener
			return;
		}

		if (update.isDone) {
			this._smoothScrolling.dispose();
			this._smoothScrolling = null;
			return;
		}

		// Continues the smooth scrolling animation
		this._smoothScrolling.animationHandle = animation.requestAnimationFrame(() => {
			// it is possible animation gets cancelled before the next frame
			if (!this._smoothScrolling) {
				return;
			}

			// perform the actual animation
			animation.cancelAnimationFrame(this._smoothScrolling.animationHandle);
			this.__doScrollSmoothly();
		});
	}

	/**
	 * @description 
	 * @param update 
	 * @param isSmoothScrolling 
	 * @returns 
	 */
	private __setStatus(update: ScrollStatus, isSmoothScrolling: boolean): void {

		// if status not changing, we do nothing.
		if (this._status.equal(update)) {
			return;
		}

		// otherwise we update the status and fire the event
		const oldStatus = this._status;
		this._status = update;
		const newStatus = this._status;
		this._onDidScroll.fire({
			isSmoothScrolling: isSmoothScrolling,
			oldWidth: oldStatus.width,
			oldScrollWidth: oldStatus.scrollWidth,
			oldScrollLeft: oldStatus.scrollLeft,

			width: newStatus.width,
			scrollWidth: newStatus.scrollWidth,
			scrollLeft: newStatus.scrollLeft,

			oldHeight: oldStatus.height,
			oldScrollHeight: oldStatus.scrollHeight,
			oldScrollTop: oldStatus.scrollTop,

			height: newStatus.height,
			scrollHeight: newStatus.scrollHeight,
			scrollTop: newStatus.scrollTop,
		} as IScrollEvent);
	}
}