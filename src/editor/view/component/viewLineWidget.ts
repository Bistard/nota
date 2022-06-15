import { FastElement } from "src/base/browser/basic/fastElement";
import { IRenderMetadata, ViewEvent } from "src/editor/common/view";
import { EditorViewComponent } from "src/editor/view/component/viewComponent";
import { EditorViewContext } from "src/editor/view/editorView";
import { ILineWidget } from "src/editor/common/viewModel";

/**
 * @class // TODO
 */
export class ViewLineWidget extends EditorViewComponent {

    // [field]

    private readonly _element: FastElement<HTMLElement>;
    private readonly _lineWidget: ILineWidget;

    // [constructor]

    constructor(context: EditorViewContext) {
        super('view-line-widget', context);

        this._lineWidget = context.viewModel.getLineWidget();

        this._element = this._lineWidget.getDomElement();
        this._element.setClassName('view-line-widget');
    }

    // [public override methods]

    public render(context: IRenderMetadata): void {
        // this._lineWidget
    }

    public getDomElement(): HTMLElement {
        return this._element.element;
    }

    // [public override handle event methods]

    public override onScrolled(event: ViewEvent.ScrollEvent): boolean {
        /**
         * Since the scroll event is fired inside {@link ILineWidget} which is
         * located inside the viewModel. Once we receive the event, the editor 
         * content is already updated. We should do nothing.
         */
        return true;
    }

}