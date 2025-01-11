import { RequestAnimateController } from "src/base/browser/basic/animation";
import { DomUtility } from "src/base/browser/basic/dom";
import { Disposable } from "src/base/common/dispose";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * @class Handles the automated scrolling behavior when the mouse hovers near 
 * the edge of an editor widget's viewport, enabling smoother interactions.
 */
export class ScrollOnEdgeController extends Disposable {

    // [fields]

    private readonly _animateController: RequestAnimateController<{ mouseTop: number; }>;

    // [constructor]

    constructor(
        private readonly editorWidget: IEditorWidget,
    ) {
        super();
        this._animateController = this.__register(new RequestAnimateController(({ mouseTop }) => {
            const viewTop = DomUtility.Attrs.getViewportTop(this.editorWidget.view.editor.container);
            this.__animationOnEdge(mouseTop, viewTop);
        }));
    }

    // [public methods]

    public attemptScrollOnEdge(event: MouseEvent): void {
        this._animateController.requestOnEveryFrame({ mouseTop: event.clientY });
    }

    public clearCache(): void {
        this._animateController.cancel();
    }

    public override dispose(): void {
        super.dispose();
        this.clearCache();
    }

    // [private methods]

    private __animationOnEdge(mouseTop: number, viewTop: number): void {
        if (mouseTop === undefined) {
            return;
        }

        const view = this.editorWidget.view.editor.container;
        const rect = view.getBoundingClientRect();
        const y = mouseTop - viewTop;

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