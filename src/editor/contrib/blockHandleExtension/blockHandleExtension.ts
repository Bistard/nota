import "src/editor/contrib/blockHandleExtension/blockHandleExtension.scss";
import { Icons } from "src/base/browser/icon/icons";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IEditorMouseEvent } from "src/editor/view/proseEventBroadcaster";
import { IWidgetBar, WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { addDisposableListener, EventType, Orientation } from "src/base/browser/basic/dom";
import { RequestAnimateController, requestAtNextAnimationFrame } from "src/base/browser/basic/animation";
import { Event } from "src/base/common/event";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorDragState, getDropExactPosition } from "src/editor/common/cursorDrop";
import { DisposableBucket } from "src/base/common/dispose";
import { Button, IButtonOptions } from "src/base/browser/basic/button/button";

/**
 * An interface only for {@link EditorBlockHandleExtension}.
 */
export interface IEditorBlockHandleExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.BlockHandle;
}

export class EditorBlockHandleExtension extends EditorExtension implements IEditorBlockHandleExtension {

    // [field]

    public readonly id = EditorExtensionIDs.BlockHandle;

    /**
     * When dragging, this indicates the current exact dropping position in
     * ProseMirror document.
     */
    public get currDropPosition() { return this._currDropPosition; }
    private _currDropPosition?: number;

    private _widget?: IWidgetBar<AbstractBlockHandleButton>;
    private readonly _renderController: RequestAnimateController<{ event: IEditorMouseEvent }>;

    // [constructor]

    constructor(editorWidget: IEditorWidget) {
        super(editorWidget);
        
        // render widget when possible
        this.__register(this.onMouseMove(e => {
            this._renderController.request({ event: e });
        }));

        // unrender cases
        this.__register(Event.any([this.onMouseLeave, this.onDidRender, this.onDidBlur])(() => {
            this.unrenderWidget();
        }));

        // RENDER LOGIC
        this._renderController = this.__register(new RequestAnimateController(({ event: e }) => {
            /**
             * If hovering outside the editor (hovering overlay), we still can
             * try to render the widget.
             */
            if (!e.target) {
                this.__renderWidgetWithoutTarget(e);
                return;
            }

            // same position, do nothing.
            if (this.currDropPosition === e.target.resolvedPosition) {
                return;
            }
            
            // not the top-level node, do nothing.
            const pos = e.view.state.doc.resolve(e.target.resolvedPosition);
            if (pos.depth !== 0) { // review: shouldn't it compare to 1?
                return;
            }

            this.unrenderWidget();
            this.renderWidget(editorWidget.view.editor.overlayContainer, e.target.resolvedPosition, e.target.nodeElement);
        }));
    }

    protected override onViewInit(view: ProseEditorView): void {
        this._widget = this.__register(this.__initWidget(view));
    }

    protected override onViewDestroy(view: ProseEditorView): void {
        this.release(this._widget);
        this._widget = undefined;
        this._currDropPosition = undefined;
        this._renderController.cancel();
    }

    // [public methods]

    public unrenderWidget(): void {
        this._widget?.unrender();
        this._currDropPosition = undefined;
    }

    public renderWidget(container: HTMLElement, nodePosition: number, nodeElement: HTMLElement): void {
        if (!this._widget) {
            return;
        }

        this._currDropPosition = nodePosition;

        // render under the editor overlay
        this._widget.container.setLeft(nodeElement.offsetLeft - 55);
        this._widget.container.setTop(nodeElement.offsetTop);
        this._widget.render(container);

        // fade-out effect
        this._widget.container.setOpacity(0);
        requestAtNextAnimationFrame(() => {
            this._widget?.container.setOpacity(1);
        });
    }

    // [private methods]

    private __renderWidgetWithoutTarget(e: IEditorMouseEvent): void {
        const position = getDropExactPosition(e.view, e.event, true);
        if (this.currDropPosition === position) {
            return;
        }

        const node = e.view.nodeDOM(position) as HTMLElement | undefined;
        if (!node) {
            return;
        }

        this.unrenderWidget();
        this.renderWidget(this._editorWidget.view.editor.overlayContainer, position, node);
    }

    private __initWidget(view: ProseEditorView): IWidgetBar<AbstractBlockHandleButton> {
        const widget = new WidgetBar<AbstractBlockHandleButton>('block-handle-widget', {
            orientation: Orientation.Horizontal,
        });
        
        // add-new-block
        const addButtonBucket = new DisposableBucket();
        const addButton = addButtonBucket.register(new AddBlockButton());
        widget.addItem({
            id: addButton.id,
            data: addButton,
            disposable: addButtonBucket,
        });

        // drag-handle
        const dragButtonLifecycle = new DisposableBucket();
        const dragButton = dragButtonLifecycle.register(new DragHandleButton(view, this._editorWidget, this));
        widget.addItem({
            id: dragButton.id,
            data: dragButton,
            disposable: dragButtonLifecycle,
        });

        return widget;
    }
}

class AbstractBlockHandleButton extends Button {

    constructor(opts: IButtonOptions) {
        super({
            ...opts,
            classes: ['block-handle-button', ...(opts.classes ?? [])],
        });
    }
}

class DragHandleButton extends AbstractBlockHandleButton {

    constructor(
        private readonly view: ProseEditorView,
        private readonly editorWidget: IEditorWidget,
        private readonly extension: EditorBlockHandleExtension,
    ) {
        super({
            id: 'drag-handle',
            icon: Icons.DragHandle,
            classes: ['add-new-block'],
        });
    }

    protected override __render(element: HTMLElement): void {
        super.__render(element);
        
        // tell the browser the button is draggable
        this.element.draggable = true;

        // on drag start
        this.__register(addDisposableListener(this.element, EventType.dragstart, e => {
            const currDropPosition = this.extension.currDropPosition;
            if (e.dataTransfer === null || currDropPosition === undefined) {
                return;
            }

            this.editorWidget.updateContext('editorDragState', EditorDragState.Block);
            this.element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const element = this.view.nodeDOM(currDropPosition) as HTMLElement;
            e.dataTransfer.setDragImage(element, 0, 0);

            const dragPosition = currDropPosition.toString();
            e.dataTransfer.setData('$nota-editor-block-handle', dragPosition);
        }));

        this.__register(addDisposableListener(this.element, EventType.dragend, e => {
            this.__dropEndAfterWork();
        }));

        this.__register(this.extension.onDrop(e => {
            this.__dropEndAfterWork();
        }));

        this.__register(this.extension.onDropOverlay(e => {
            this.__dropEndAfterWork();
        }));
    }

    private __dropEndAfterWork(): void {
        this.element.classList.remove('dragging');
        this.extension.unrenderWidget();
    }
}

class AddBlockButton extends AbstractBlockHandleButton {

    constructor() {
        super({ 
            id: 'add-new-block', 
            icon: Icons.AddNew, 
            classes: ['add-new-block'],
        });
    }

    // TODO
}