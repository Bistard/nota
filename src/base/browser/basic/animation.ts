import { IDisposable, toDisposable } from "src/base/common/dispose";
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
    return toDisposable(() => {
        if (window) {
            window.cancelAnimationFrame(token);
        } else {
            clearTimeout(token);
        }
    });
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