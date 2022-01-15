
/**
 * when the current enviroment is too old to support `requestAnimationFrame`, we 
 * try to simulate it (not perfect though).
 */
const _simulateRequestAnimationFrame = (callback: Function) => callback();

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
 * @returns A number handle for cancellation.
 */
export const requestAnimationFrame: (callback: FrameRequestCallback) => number = 
    window.requestAnimationFrame ||
    (window as any).mozRequestAnimationFrame || 
    (window as any).webkitRequestAnimationFrame ||
    (window as any).msRequestAnimationFrame ||
    _simulateRequestAnimationFrame;

/**
 * @readonly The method may be passed into a handle which is returned when the 
 * request was succeed to cancel the corresponding callback animation.
 * @param handle A number handle returned by requestAnimationFrame().
 */
export const cancelAnimationFrame: (handle: number) => void = 
    window.cancelAnimationFrame;
