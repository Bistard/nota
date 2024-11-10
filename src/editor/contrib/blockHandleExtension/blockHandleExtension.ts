import "src/editor/contrib/blockHandleExtension/blockHandleExtension.scss";
import { Icons } from "src/base/browser/icon/icons";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IEditorMouseEvent } from "src/editor/view/proseEventBroadcaster";
import { IWidgetBar, WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { BlockHandleButton } from "src/editor/contrib/blockHandleExtension/blockHandleButton";
import { addDisposableListener, EventType, Orientation } from "src/base/browser/basic/dom";
import { requestAtNextAnimationFrame } from "src/base/browser/basic/animation";
import { Event } from "src/base/common/event";
import { EditorView } from "prosemirror-view";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { getDropExactPosition } from "src/editor/common/cursorDrop";
import { DisposableManager } from "src/base/common/dispose";

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

    // [constructor]

    constructor(editorWidget: IEditorWidget) {
        super(editorWidget);
        
        // render
        this.__register(this.onMouseMove(e => {
            if (!e.target) {
                return;
            }

            if (this._currPosition === e.target.resolvedPosition) {
                return;
            }
            
            // // not the top-level node, we ignore it.
            const pos = e.view.state.doc.resolve(e.target.resolvedPosition);
            if (pos.depth !== 0) {
                return;
            }

            this.__unrenderWidget();
            this.__renderWidget(editorWidget.view.editor.overlayContainer, e.target);
        }));

        // unrender
        this.__register(Event.any([this.onMouseLeave, this.onTextInput])(() => {
            this.__unrenderWidget();
        }));
    }

    protected override onViewInit(view: EditorView): void {
        this._widget = this.__initWidget(view);
    }

    protected override onViewDestroy(view: EditorView): void {
        this._widget?.dispose();
        this._widget = undefined;
        this._currPosition = undefined;
    }

    // [private methods]

    private __renderWidget(container: HTMLElement, target: NonNullable<IEditorMouseEvent['target']>): void {
        if (!this._widget) {
            return;
        }

        this._currPosition = target.resolvedPosition;

        // render under the editor overlay
        this._widget.container.setLeft(target.nodeElement.offsetLeft - 55);
        this._widget.container.setTop(target.nodeElement.offsetTop);
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
                dispose: button.dispose.bind(button),
            });
        }

        const dragButtonLifecycle = new DisposableManager();
        const dragButton = dragButtonLifecycle.register(new DragHandleButton());
        widget.addItem({
            id: dragButton.id,
            data: dragButton,
            dispose: () => dragButtonLifecycle.dispose(),
        });
        this.__initDragButton(view, dragButton, dragButtonLifecycle);

        return widget;
    }

    private __initDragButton(view: ProseEditorView, button: DragHandleButton, lifecycle: DisposableManager): void {
        button.element.draggable = true;

        lifecycle.register(addDisposableListener(button.element, EventType.dragstart, e => {
            if (e.dataTransfer === null || !this._currPosition) {
                return;
            }

            button.element.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';

            const element = view.nodeDOM(this._currPosition) as HTMLElement;
            e.dataTransfer.setDragImage(element, 0, 0);

            e.dataTransfer.setData('$nota-editor-block-handle', this._currPosition.toString());
        }));

        lifecycle.register(this.onDrop(e => {
            if (!e.browserEvent.dataTransfer) {
                return;
            }

            const data = e.browserEvent.dataTransfer.getData('$nota-editor-block-handle');
            if (data === '') {
                // not a drop action from the drag-handle button, do nothing.
                return;
            }

            const dropPosition = getDropExactPosition(view, e.browserEvent);
            if (!dropPosition) {
                // drop on no where, do nothing.
                return;
            }

            const dragPosition = parseInt(data);
            if (dragPosition === dropPosition) {
                // drop at exact same position, do nothing.
                return;
            }

            const tr = view.state.tr;
            const node = tr.doc.nodeAt(dragPosition);
            if (!node) {
                return;
            }

            /**
             * We need to consider for the offset caused by deletion.
             */
            const adjustedDropPosition = dragPosition < dropPosition 
                ? dropPosition - node.nodeSize 
                : dropPosition;

            tr.delete(dragPosition, dragPosition + node.nodeSize)
              .insert(adjustedDropPosition, node);
            view.dispatch(tr.scrollIntoView());
            
            /**
             * Since we are clicking the button outside the editor, we need to 
             * manually focus the editor after drop.
             */
            view.focus();

            // prevent default drop behavior from prosemirror.
            e.preventDefault();

            // reset widget position
            this.__unrenderWidget();
        }));
    }
}

class DragHandleButton extends BlockHandleButton {

    constructor() {
        super({
            id: 'drag-handle',
            icon: Icons.Menu,
            classes: ['add-new-block'],
        });
    }
}