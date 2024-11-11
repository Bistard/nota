import { requestAnimate } from "src/base/browser/basic/animation";
import { DomUtility } from "src/base/browser/basic/dom";
import { IDisposable } from "src/base/common/dispose";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * @class Handles the automated scrolling behavior when the mouse hovers near 
 * the edge of an editor widget's viewport, enabling smoother interactions.
 */
export class ScrollOnEdgeController implements IDisposable {

    // [fields]

    private _scrollAnimationMouseTop?: number;
    private _scrollAnimationOnEdgeDisposable?: IDisposable;

    // [constructor]

    constructor(
        private readonly editorWidget: IEditorWidget,
    ) {}

    // [public methods]

    public attemptScrollOnEdge(event: MouseEvent): void {
        if (!this._scrollAnimationOnEdgeDisposable) {
            const top = DomUtility.Attrs.getViewportTop(this.editorWidget.view.editor.container);
            this._scrollAnimationOnEdgeDisposable = requestAnimate(() => this.__animationOnEdge(top));
        }
        this._scrollAnimationMouseTop = event.clientY;
    }

    public clearCache(): void {
        this._scrollAnimationMouseTop = undefined;
        this._scrollAnimationOnEdgeDisposable?.dispose();
        this._scrollAnimationOnEdgeDisposable = undefined;
    }

    public dispose(): void {
        this.clearCache();
    }

    // [private methods]

    private __animationOnEdge(viewTop: number): void {
        if (this._scrollAnimationMouseTop === undefined) {
            return;
        }

        const view = this.editorWidget.view.editor.container;
        const rect = view.getBoundingClientRect();
        const y = this._scrollAnimationMouseTop - viewTop;

        const edgeThreshold  = 100;
        const lowerLimit     = edgeThreshold;
		const upperLimit     = Math.max(0, rect.height - edgeThreshold);
        
		if (y < lowerLimit) {
            view.scrollBy(0, Math.max(-20, Math.floor(0.2 * (y - edgeThreshold))));
		} 
        else if (y > upperLimit) {
            view.scrollBy(0, Math.min(20, Math.floor(0.2 * (y - upperLimit))));
		}
    }
}