/**
 * This is a simple script to setup jsdom to polyfill Web APIs when testing in 
 * Mocha (node.js) environment.
 */

const { JSDOM } = require('jsdom');

// Create a JSDOM instance
const { window } = new JSDOM('', {
    url: "http://localhost",
    pretendToBeVisual: true,
    userAgent: global.userAgent,
});

global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.MutationObserver = window.MutationObserver;
global.Range = window.Range;

// Make properties of `window` available globally
Object.keys(window).forEach((property) => {
    if (typeof global[property] === 'undefined') {
        global[property] = window[property];
    }
});

window.console = global.console;

/**
 * fix: Prevents the CodeMirror error 'getClientRects is undefined'
 * @see https://github.com/jsdom/jsdom/issues/3002
 */
document.createRange = () => {
    const range = new Range();
    range.getClientRects = () => ({
        item: () => null,
        length: 0,
        [Symbol.iterator]: function *() {
            yield* [];
        },
    });
    return range;
};