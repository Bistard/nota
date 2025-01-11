import { DomEventHandler, DomUtility } from "src/base/browser/basic/dom";
import { IListMouseEvent, IListTouchEvent, IListWidget, IListWidgetOpts } from "src/base/browser/secondary/listWidget/listWidget";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IS_MAC } from "src/base/common/platform";
import { Arrays } from "src/base/common/utilities/array";

/**
 * @internal
 * @class An internal class that handles the mouse support of {@link IListWidget}.
 * It handles:
 *  - when to focus DOM
 *  - when to focus item
 *  - when to select item(s)
 *  - when to hover item(s)
 * 
 * @readonly EXPORT FOR OTHER MODULES ONLY. DO NOT USE DIRECTLY.
 */
export class ListWidgetMouseController<T> extends Disposable {

    // [fields]

    private _view: IListWidget<T>;

    private _multiSelectionSupport: boolean = true;

    // [constructor]

    constructor(view: IListWidget<T>, opts: IListWidgetOpts<T>) {
        super();
        this._view = view;

        this._view.DOMElement.classList.add('mouse-support');

        if (opts.multiSelectionSupport !== undefined) {
            this._multiSelectionSupport = opts.multiSelectionSupport;
        }

        this.__register(view.onMouseout((e) => this.__onMouseout(e)));
        this.__register(view.onMouseover(e => this.__onMouseover(e)));
        this.__register(view.onMousedown(e => this.__onMouseDown(e)));
        this.__register(view.onTouchstart(e => this.__onMouseDown(e)));
        this.__register(view.onClick(e => this.__onMouseClick(e)));
        this.__register(view.onDidChangeFocus(e => this.__onDidChangeFocus(e)));
    }

    // [protect methods]

    protected __ifSupported(e: IListMouseEvent<T>): boolean {
        if (DomUtility.Elements.isInputElement(e.browserEvent.target as HTMLElement)) {
            return false;
        }
        return true;
    }

    protected __onMouseout(e: IListMouseEvent<T>): void {
        this._view.setHover([]);
    }

    protected __onMouseover(e: IListMouseEvent<T>): void {
        if (e.actualIndex === undefined) {
            return;
        }
        this._view.setHover([e.actualIndex]);
    }

    /**
     * @description Handles item focus and selection logic.
     */
    protected __onMouseClick(e: IListMouseEvent<T>): void {

        if (this.__ifSupported(e) === false) {
            return;
        }

        const toFocused = e.actualIndex;
        
        // clicking nowhere, we reset all the traits
        if (toFocused === undefined) {
            this._view.setFocus(null);
            this._view.setAnchor(null);
            this._view.setSelections([]);
            return;
        }

        // check if selecting in range
        if (this.__isSelectingInRangeEvent(e)) {
            this.__multiSelectionInRange(e);
            return;
        } else if (this.__isSelectingInSingleEvent(e)) {
            this._multiSelectionInSingle(e);
            return;
        }

        // normal click
        this._view.setAnchor(toFocused);
        this._view.setFocus(toFocused);
        if (DomEventHandler.isRightClick(e.browserEvent) === false) {
            this._view.setSelections([toFocused]);
        }
    }

    /**
     * @description Determines if the event is selecting in range. In other words,
     * pressing SHIFT.
     */
    protected __isSelectingInRangeEvent(e: IListMouseEvent<T>): boolean {
        if (this._multiSelectionSupport === false) {
            return false;
        }
        return e.browserEvent.shiftKey;
    }

    /**
     * @description Determines if the event is selecting in single. In other words,
     * pressing CTRL in Windows or META in Macintosh.
     */
    protected __isSelectingInSingleEvent(e: IListMouseEvent<T>): boolean {
        if (this._multiSelectionSupport === false) {
            return false;
        }
        return IS_MAC ? e.browserEvent.metaKey : e.browserEvent.ctrlKey;
    }

    // [private helper methods]

    /**
     * @description Focuses the event target element.
     */
    private __onMouseDown(e: IListMouseEvent<T> | IListTouchEvent<T>): void {
        // prevent double focus
        if (!DomUtility.Elements.isElementFocused(e.browserEvent.target)) {
			this._view.setDomFocus();
		}
    }

    private __onDidChangeFocus(isFocused: boolean): void {
        if (!isFocused) {
            this._view.setFocus(null);
        }
    }

    /**
     * @description Applies multi-selection when selecting in range.
     */
    private __multiSelectionInRange(e: IListMouseEvent<T>): void {
        const toFocused = e.actualIndex!;
        let anchor = this._view.getAnchor();

        // if no focus yet, we focus on the current.
        if (anchor === null) {
            anchor = this._view.getFocus() ?? toFocused;
            this._view.setAnchor(anchor);
        }

        /**
         * @readonly Below is not really a good implementation (could be optimized), 
         * but works.
         */

        // calculates the selection range
        const toSelectRange = Arrays.range(
            Math.min(toFocused, anchor), 
            Math.max(toFocused, anchor) + 1
        );
        const currSelection = this._view.getSelections().sort((a, b) => a - b);
        const contiguousRange = this.__getNearestContiguousRange(Arrays.unique(Arrays.insertSorted(currSelection, anchor)), anchor);
        if (!contiguousRange.length) {
            return;
        }
        const newSelection = 
            Arrays.union(toSelectRange, 
                Arrays.union(
                    Arrays.relativeComplement(currSelection, contiguousRange), 
                    Arrays.relativeComplement(contiguousRange, currSelection)
                )
            );
        
        // update selections and focused
        this._view.setSelections(newSelection);
        this._view.setFocus(toFocused);
    }

    /**
     * @description Applies multi-selection when selecting in single.
     */
    private _multiSelectionInSingle(e: IListMouseEvent<T>): void {
        const toFocused = e.actualIndex!;

        const currSelection = this._view.getSelections();
        const selectionsWithoutFocused = currSelection.filter(i => i !== toFocused);

        this._view.setFocus(toFocused);
        this._view.setAnchor(toFocused);

        if (selectionsWithoutFocused.length !== currSelection.length) {
            /**
             * We are clicking one of the selections, we update the selections 
             * except the double-clicked one.
             */
            this._view.setSelections(selectionsWithoutFocused);
        } else {
            /**
             * We are not clicking any of the current selections, we append the
             * new clicked as selection.
             */
            this._view.setSelections([...selectionsWithoutFocused, toFocused]);
        }
    }

    private __getNearestContiguousRange(range: number[], anchor: number): number[] {
        const index = range.indexOf(anchor);
        if (index === -1) {
            return [];
        }

        const result: number[] = [];
        let i = index - 1;
        while (i >= 0 && range[i] === anchor - (index - i)) {
            result.push(range[i--]!);
        }

        result.reverse();
        i = index;
        while (i < range.length && range[i] === anchor + (i - index)) {
            result.push(range[i++]!);
        }

        return result;
    }
}
