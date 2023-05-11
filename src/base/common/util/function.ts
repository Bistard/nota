
/**
 * @description Wraps the input function to ensure it can only be executed once. 
 *  If called more than once, it throws an error.
 * @param fn The function to be wrapped, ensuring it is only executed once.
 */
function executeOnce<T extends Function>(fn: T): T {
    let executed = false;
    return <any>(function (this: any, ...args: any[]) {
        if (executed) {
            throw new Error('The function can only be executed once.');
        }
        executed = true;
        return fn.apply(this, args);
    });
}