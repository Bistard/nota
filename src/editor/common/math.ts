import katex from "katex";
import { DomUtility } from "src/base/browser/basic/dom";
import { defer } from "src/base/common/utilities/async";
import { II18nService } from "src/platform/i18n/browser/i18nService";

/**
 * @description A shared function that responsible to render block/inline math
 * equations.
 * @param text The plain text that represents the math equation (excludes the 
 *             outer $ signs).
 * @param dom The parent element should be rendered under.
 * @param level The type of math equation ('block' or 'inline')
 * 
 * @note The function will guess if the equation is too large for sync rendering, 
 * it will turned into async to avoid potential blocking.
 */
export function renderMath(
    i18nService: II18nService,
    text: string, 
    dom: HTMLElement,
    level: 'inline' | 'block',
): void {
    dom.classList.add(level === 'block' ? 'math-block' : 'math-inline');

    // special case: empty math block
    if (text.trim().length === 0) {
        dom.classList.add('empty');
        const contentText = i18nService.localize('empty', 'Empty Math Block');
        dom.textContent = `< ${contentText} >`;
        return;
    }
    
    const guessIfTooLarge = text.length > 500;

    // render synchronously (blocking)
    if (!guessIfTooLarge) {
        __doRenderEquation(i18nService, text, dom, level);
        return;
    }
    
    // render asynchronously (non-blocking)
    dom.classList.add('rendering');
    const contentText = i18nService.localize('rendering', 'Rendering...');
    dom.textContent = `< ${contentText} >`;
    defer(() => {
        if (dom && !DomUtility.Elements.ifInDomTree(dom)) {
            return;
        }
        
        dom.classList.remove('rendering');
        dom.textContent = '';

        __doRenderEquation(i18nService, text, dom, level);
    });
}

function __doRenderEquation(
    i18nService: II18nService,
    text: string, 
    dom: HTMLElement,
    level: 'inline' | 'block',
): void {
    // try rendering
    try {
        katex.render(text, dom, {
            displayMode: level === 'block',
            output: 'htmlAndMathml',
            throwOnError: true,
        });
    } 
    // error rendering
    catch (error) {
        dom.classList.add('render-error');
        const contentText = i18nService.localize('error', 'Error Equations');
        dom.textContent = contentText; 
    }
}