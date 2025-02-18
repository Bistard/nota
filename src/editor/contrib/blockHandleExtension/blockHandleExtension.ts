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
import { ProseEditorView, ProseTextSelection } from "src/editor/common/proseMirror";
import { EditorDragState, getDropExactPosition } from "src/editor/common/cursorDrop";
import { Button, IButtonOptions } from "src/base/browser/basic/button/button";
import { Markdown, TokenEnum } from "src/editor/common/markdown";
import { assert } from "src/base/common/utilities/panic";
import { Disposable } from "src/base/common/dispose";
import { BlockInsertPalette } from "src/editor/view/widget/blockInsertPalette/blockInsertPlette";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IPosition } from "src/base/common/utilities/size";

// region - EditorBlockHandleExtension

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
    private readonly _paletteRenderer: PaletteRenderer;

    // [constructor]

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(editorWidget);
        this._paletteRenderer = this.__register(new PaletteRenderer(editorWidget, instantiationService));
        
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

    public renderPalette(position: IPosition): void {
        this._paletteRenderer.render(position);
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
        
        [
            AddBlockButton,
            DragHandleButton,
        ]
        .forEach(buttonCtor => {
            const button = new buttonCtor(view, this._editorWidget, this);
            widget.addItem({
                id: button.id,
                data: button,
                disposable: button,
            });
        });

        return widget;
    }
}

// region - Buttons

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

    constructor(
        private readonly view: ProseEditorView,
        private readonly editorWidget: IEditorWidget,
        private readonly extension: EditorBlockHandleExtension,
    ) {
        super({ 
            id: 'add-new-block', 
            icon: Icons.AddNew, 
            classes: ['add-new-block'],
        });
    }

    protected override __render(element: HTMLElement): void {
        super.__render(element);

        this.__register(this.onDidClick(() => {
            
            // pre-condition checks
            const currentDropPosition = this.extension.currDropPosition;
            if (currentDropPosition === undefined) {
                return;
            }

            const { state } = this.view;
            const $pos = state.doc.resolve(currentDropPosition);
            if ($pos.depth !== 0) {
                return;
            }

            const currentNode = $pos.nodeAfter;
            if (!currentNode) {
                return;
            }

            // insert an empty paragraph right below the current block
            const insertPosition = currentDropPosition + currentNode.nodeSize;
            const paragraph = assert(Markdown.Create.empty(state, TokenEnum.Paragraph, {}));
            let newTr = state.tr.insert(insertPosition, paragraph);

            // set selection to it
            const newPos = insertPosition + 1;
            if (newPos <= newTr.doc.content.size) {
                newTr = newTr.setSelection(ProseTextSelection.create(newTr.doc, newPos));
            }

            // update to view
            this.view.dispatch(newTr);

            // render palette
            const domPosition = this.view.coordsAtPos(insertPosition);
            this.extension.renderPalette(domPosition);

            // re-focus
            this.view.focus();
        }));
    }
}

// region - PaletteRenderer

class PaletteRenderer extends Disposable {

    // [field]

    private readonly _palette: BlockInsertPalette;

    // [constructor]

    constructor(
        private readonly editorWidget: IEditorWidget,
        private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this._palette = this.__register(this.instantiationService.createInstance(BlockInsertPalette, this.editorWidget));
    }

    // [public methods]

    public render(position: IPosition): void {
        this.destroy();
        this._palette.render(position);
    }

    public destroy(): void {
        this._palette?.destroy();
    }
}