
/**
 * when the current enviroment is too old to support `requestAnimationFrame`, we 
 * try to simulate it (not perfect though).
 */
const _simulateRequestAnimationFrame = (callback: Function) => setTimeout(() => callback(), 0);

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
  * beacuse when importing this file as below:
  * ```js
  * import * as animation from "src/base/common/animation";
  * animation.requestAnimationFrame( () => {} );
  * ```
  * An error will be thrown since requestAnimationFrame must be excuted via the 
  * context of `window`. To fix this, a wrapper function will fix this properly
  * by using `.call()`.
  */
export let requestAnimationFrame: (callback: FrameRequestCallback) => number;

requestAnimationFrame = (callback): number => {
    let doRequestAnimationFrame = window.requestAnimationFrame ||
        (window as any).mozRequestAnimationFrame || 
        (window as any).webkitRequestAnimationFrame ||
        (window as any).msRequestAnimationFrame ||
        _simulateRequestAnimationFrame;
    
    return doRequestAnimationFrame.call(window, callback);
}
 
 /**
  * @readonly The method may be passed into a handle which is returned when the 
  * request was succeed to cancel the corresponding callback animation.
  */
export let cancelAnimationFrame: (handle: number) => void;

cancelAnimationFrame = (handle: number): void => {
    window.cancelAnimationFrame(handle);
}
