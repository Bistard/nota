import { ScrollableWidget } from "src/base/browser/secondary/scrollableWidget/scrollableWidget";
import { IDisposable } from "src/base/common/dispose";
import { DOMSize } from "src/base/common/dom";
import { IScrollEvent } from "src/base/common/scrollable";

export interface IListViewRenderer {
    renderElement(): void;
    disposeElement(): void;
}

export class ListView<T> implements IDisposable {

    private element: HTMLElement;
    private listContainer: HTMLElement;

    private scrollableWidget: ScrollableWidget;

    constructor(container: HTMLElement, transformOptimization: boolean = true) {

        this.element = document.createElement('div');
        this.element.className = 'list-view';

        this.listContainer = document.createElement('div');
        this.listContainer.className = 'list-view-container';
        if (transformOptimization) {
            // see https://www.afasterweb.com/2017/07/27/optimizing-repaints/
            this.listContainer.style.transform = 'translate3d(0px, 0px, 0px)';
        }
        
        this.scrollableWidget = new ScrollableWidget({
            scrollPosition: 0,
            scrollSize: DOMSize.getContentHeight(container) * 10,
            viewportSize: DOMSize.getContentHeight(container)
        }, {});
        this.scrollableWidget.render(document.createElement('div'));

        this.listContainer.appendChild(this.scrollableWidget.element!);
        this.element.appendChild(this.listContainer);
        container.appendChild(this.element);
    }

    public dispose(): void {
        
    }

    // [private helper methods]

    private __onScroll(e: IScrollEvent): void {
        
    }

}