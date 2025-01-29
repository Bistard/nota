import { Disposable, IDisposable, safeDisposable, toDisposable } from "src/base/common/dispose";
import { Callable } from "src/base/common/utilities/type";

/**
 * when the current environment is too old to support `requestAnimationFrame`, we 
 * try to simulate it (not perfect though).
 */
const _simulateRequestAnimationFrame = (callback: Callable<[], void>) => setTimeout(() => callback(), 0);

/**
 * @readonly Traditionally to create an animation in JavaScript, we relied on 
 * setTimeout() called recursively or setInterval() called repeatedly. However,
 * due to user system it may leads to inconsistent delay intervals between 
 * animation frames.
 * 
 * The method allows you to execute code on the next available screen repaint 
 * and resulting in a smoother, more efficient animation.
 * 
 * @note Furthermore, callback running via this method will be either paused or 
 * slowed down significantly when browser running in background (since there is 
 * no point to render animation when it is invisible).
 * 
 * @link more details from http://www.javascriptkit.com/javatutors/requestanimationframe.shtml
 * 
 * @readonly The reason using a wrapper anonymous here (doRequestAnimationFrame()) 
 * because when importing this file as below:
 * ```js
 * import * as animation from "src/base/common/animation";
 * animation.requestAnimationFrame( () => {} );
 * ```
 * An error will be thrown since requestAnimationFrame must be executed via the 
 * context of `window`. To fix this, a wrapper function will fix this properly
 * by using `.call()`.
 * 
 * Also, wrapping is also important to make this function can be used anywhere 
 * outside browser environment (the behavior will fallback to `setTimeout`).
 */
export const requestAtNextAnimationFrame = (callback: FrameRequestCallback): IDisposable => {
    const doRequestAnimationFrame = window && (
        window.requestAnimationFrame ||
        (<any>window).mozRequestAnimationFrame || 
        (<any>window).webkitRequestAnimationFrame ||
        (<any>window).msRequestAnimationFrame ||
        _simulateRequestAnimationFrame
    );
    
    const token = doRequestAnimationFrame.call(window, callback);
    return safeDisposable(
        toDisposable(() => {
            if (window) {
                window.cancelAnimationFrame(token);
            } else {
                clearTimeout(token);
            }
        })
    );
};

/**
 * @description Continue requesting at next animation frame on the provided 
 * callback and returns a Disposable to stop it.
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
 * @class A controller class to manage animation frame requests with updatable 
 * arguments. The controller allows for scheduled callback execution on the next 
 * animation frame, with the option to update specific arguments before execution.
 *
 * @template TArgumentMap An object type representing the arguments for the animation callback.
 */
export class RequestAnimateController<TArgumentMap extends Record<string, unknown>> extends Disposable {

    // [field]

    private _animateDisposable?: IDisposable;
    private _latestArguments?: TArgumentMap;
    private _callback: (argsObject: TArgumentMap) => void;

    // [constructor]
    
    /**
     * @param callback The callback function to be executed with the latest 
     * arguments on the next animation frame.
     */
    constructor(
        callback: (argsObject: TArgumentMap) => void
    ) {
        super();
        this._callback = callback;
    }

    // [public methods]

    /**
     * @description Requests a callback execution on the next animation frame 
     * with the specified arguments.
     * 
     * @param latestArguments The arguments to update and pass to the callback 
     * on the next animation frame.
     */
    public request(latestArguments: TArgumentMap): void {
        this._latestArguments = latestArguments;
        
        if (!this._animateDisposable) {
            this._animateDisposable = this.__register(requestAtNextAnimationFrame(() => {
                this._animateDisposable = undefined;
                if (!this._latestArguments) {
                    return;
                }
                this._callback(this._latestArguments);
            }));
        }
    }

    /**
     * @description Continuously requests callback execution on every animation 
     * frame with the specified arguments. The request persists and continues to 
     * schedule the callback on each frame until manually disposed.
     *
     * @param latestArguments The arguments to update and pass to the callback 
     * on each animation frame.
     */
    public requestOnEveryFrame(latestArguments: TArgumentMap): void {
        this._latestArguments = latestArguments;

        if (!this._animateDisposable) {
            this._animateDisposable = this.__register(requestAnimate(() => {
                if (!this._latestArguments) {
                    return;
                }
                this._callback(this._latestArguments);
            }));
        }
    }

    /**
     * @description Cancels the currently scheduled animation frame request, if 
     * any. Resets the latest arguments to undefined, clears the request handle,
     * and returns the last set arguments for potential resource cleanup.
     *
     * @returns The latest arguments that were set before cancellation, or 
     * `undefined` if none were set.
     */
    public cancel(): TArgumentMap | undefined {
        this.release(this._animateDisposable);
        this._animateDisposable = undefined;
        
        const args = this._latestArguments;
        this._latestArguments = undefined;
        return args;
    }

    public override dispose(): void {
        this.cancel();
        super.dispose();
    }
}
