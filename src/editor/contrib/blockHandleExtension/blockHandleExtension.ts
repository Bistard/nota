import "src/editor/contrib/blockHandleExtension/blockHandleExtension.scss";
import { Icons } from "src/base/browser/icon/icons";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IEditorMouseEvent } from "src/editor/view/proseEventBroadcaster";
import { IWidgetBar, WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { BlockHandleButton } from "src/editor/contrib/blockHandleExtension/blockHandleButton";
import { addDisposableListener, EventType, Orientation } from "src/base/browser/basic/dom";
import { RequestAnimateController, requestAtNextAnimationFrame } from "src/base/browser/basic/animation";
import { Event } from "src/base/common/event";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { EditorDragState, getDropExactPosition } from "src/editor/common/cursorDrop";
import { DisposableBucket } from "src/base/common/dispose";

/**
 * An interface only for {@link EditorBlockHandleExtension}.
 */
export interface IEditorBlockHandleExtension extends IEditorExtension {

    readonly id: EditorExtensionIDs.BlockHandle;
}

export class EditorBlockHandleExtension extends EditorExtension implements IEditorBlockHandleExtension {

    // [field]

    public readonly id = EditorExtensionIDs.BlockHandle;

    private _currPosition?: number;
    private _widget?: IWidgetBar<BlockHandleButton>;
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
            this.__unrenderWidget();
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
            if (this._currPosition === e.target.resolvedPosition) {
                return;
            }
            
            // not the top-level node, do nothing.
            const pos = e.view.state.doc.resolve(e.target.resolvedPosition);
            if (pos.depth !== 0) {
                return;
            }

            this.__unrenderWidget();
            this.__renderWidget(editorWidget.view.editor.overlayContainer, e.target.resolvedPosition, e.target.nodeElement);
        }));
    }

    protected override onViewInit(view: ProseEditorView): void {
        this._widget = this.__register(this.__initWidget(view));
    }

    protected override onViewDestroy(view: ProseEditorView): void {
        this.release(this._widget);
        this._widget = undefined;
        this._currPosition = undefined;
        this._renderController.cancel();
    }

    // [private methods]

    private __renderWidgetWithoutTarget(e: IEditorMouseEvent): void {
        const position = getDropExactPosition(e.view, e.event, true);
        if (this._currPosition === position) {
            return;
        }

        const node = e.view.nodeDOM(position) as HTMLElement | undefined;
        if (!node) {
            return;
        }

        this.__unrenderWidget();
        this.__renderWidget(this._editorWidget.view.editor.overlayContainer, position, node);
    }

    private __renderWidget(container: HTMLElement, nodePosition: number, nodeElement: HTMLElement): void {
        if (!this._widget) {
            return;
        }

        this._currPosition = nodePosition;

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

    private __unrenderWidget(): void {
        this._widget?.unrender();
        this._currPosition = undefined;
    }

    private __initWidget(view: ProseEditorView): IWidgetBar<BlockHandleButton> {
        const widget = new WidgetBar<BlockHandleButton>('block-handle-widget', {
            orientation: Orientation.Horizontal,
        });
        
        const buttonsOptions = [
            { id: 'add-new-block', icon: Icons.AddNew, classes: ['add-new-block'] },
        ];

        for (const { id, icon, classes } of buttonsOptions) {
            const button = new BlockHandleButton({ id: id, icon: icon, classes: [...classes] });

            widget.addItem({
                id: id,
                data: button,
                disposable: button,
            });
        }

        const dragButtonLifecycle = new DisposableBucket();
        const dragButton = dragButtonLifecycle.register(new DragHandleButton());
        widget.addItem({
            id: dragButton.id,
            data: dragButton,
            disposable: dragButtonLifecycle,
        });
        this.__initDragButton(view, dragButton, dragButtonLifecycle);

        return widget;
    }

    private __initDragButton(view: ProseEditorView, button: DragHandleButton, lifecycle: DisposableBucket): void {
        
        // tell the browser the button is draggable
        button.element.draggable = true;

        // on drag start
        lifecycle.register(addDisposableListener(button.element, EventType.dragstart, e => {
            if (e.dataTransfer === null || this._currPosition === undefined) {
                return;
            }

            this._editorWidget.updateContext('editorDragState', EditorDragState.Block);
            button.element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const element = view.nodeDOM(this._currPosition) as HTMLElement;
            e.dataTransfer.setDragImage(element, 0, 0);

            const dragPosition = this._currPosition.toString();
            e.dataTransfer.setData('$nota-editor-block-handle', dragPosition);
        }));

        lifecycle.register(addDisposableListener(button.element, EventType.dragend, e => {
            this.__dropEndAfterWork(button);
        }));

        lifecycle.register(this.onDrop(e => {
            this.__dropEndAfterWork(button);
        }));

        lifecycle.register(this.onDropOverlay(e => {
            this.__dropEndAfterWork(button);
        }));
    }

    private __dropEndAfterWork(button: DragHandleButton): void {
        button.element.classList.remove('dragging');
        this.__unrenderWidget();
    }
}

class DragHandleButton extends BlockHandleButton {

    constructor() {
        super({
            id: 'drag-handle',
            icon: Icons.DragHandle,
            classes: ['add-new-block'],
        });
    }
}