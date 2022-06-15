import { FastElement } from "src/base/browser/basic/fastElement";
import { IListWidget, ListWidget } from "src/base/browser/secondary/listWidget/listWidget";
import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { IRange } from "src/base/common/range";
import { IScrollEvent } from "src/base/common/scrollable";
import { IEditorViewModel, ILineWidget } from "src/editor/common/viewModel";
import { EditorItemRenderer, HeadingRenderer } from "src/editor/view/editorRenderer";
import { EditorItem, EditorItemProvider } from "src/editor/viewModel/editorItem";

/**
 * @class A {@link ListWidget} that manages to render each line of the editor.
 * Each line is dynamic height.
 */
export class LineWidget extends Disposable implements ILineWidget {

    // [event]

    public readonly onDidScroll: Register<IScrollEvent>;

    // [field]

    private readonly _element: FastElement<HTMLElement>;
    private readonly _listWidget: IListWidget<EditorItem>;

    // [constructor]

    constructor(private readonly viewModel: IEditorViewModel) {
        super();

        this._element = new FastElement(document.createElement('div'));

        this._listWidget = this.__register(new ListWidget<EditorItem>(
            this._element.element, 
            [
                new HeadingRenderer(),
            ]
            .map(renderer => new EditorItemRenderer(renderer)), 
            new EditorItemProvider(), 
            {
                // options
                layout: true
            }
        ));

        this.onDidScroll = this._listWidget.onDidScroll;
    }

    // [public methods]

    public getDomElement(): FastElement<HTMLElement> {
        return this._element;
    }

    public getVisibleRange(): IRange {
        return this._listWidget.getVisibleRange();
    }

    public getScrollPosition(): number {
        return this._listWidget.getScrollPosition();
    }
    
    public getViewportSize(): number {
        return this._listWidget.getViewportSize();
    }

}