import "src/editor/view/widget/palette/palette.scss";
import { AnchorPrimaryAxisAlignment, AnchorVerticalPosition } from "src/base/browser/basic/contextMenu/contextMenu";
import { MenuAction, MenuItemType } from "src/base/browser/basic/menu/menuItem";
import { Disposable, DisposableBucket, IDisposable, safeDisposable } from "src/base/common/dispose";
import { Emitter, Priority } from "src/base/common/event";
import { KeyCode } from "src/base/common/keyboard";
import { IO } from "src/base/common/utilities/functional";
import { IPosition } from "src/base/common/utilities/size";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { ProseTools } from "src/editor/common/proseUtility";
import { IEditorWidget } from "src/editor/editorWidget";
import { II18nService } from "src/platform/i18n/browser/i18nService";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";

// region - EditorPalette

export interface IEditorPaletteOptions {

    readonly contentProvider: IO<MenuAction[]>;
}

/**
 * {@link EditorPalette} // TODO
 */
export class EditorPalette extends Disposable {

    // [event]

    get onDestroy() { return this._renderer.onMenuDestroy; }

    // [field]

    private readonly _renderer: PaletteRenderer;
    private readonly _keyboardController: PaletteKeyboardController;

    // [constructor]

    constructor(
        private readonly editorWidget: IEditorWidget,
        options: IEditorPaletteOptions,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
        @II18nService i18nService: II18nService,
    ) {
        super();
        this._renderer = this.__register(new PaletteRenderer(editorWidget, options, contextMenuService, i18nService));
        this._keyboardController = this.__register(new PaletteKeyboardController(editorWidget, this));

        // always back to normal
        this.__register(this._renderer.onMenuDestroy(() => {
            this._keyboardController.unlisten();
            editorWidget.view.editor.focus();
        }));

        // menu click logic
        this.__register(this.contextMenuService.contextMenu.onActionRun(e => {
            contextMenuService.contextMenu.destroy();
        }));
    }

    // [public methods]

    public render(position: IPosition): void {
        this._renderer.show(position);
        this._keyboardController.listen(this.editorWidget.view.editor.internalView);
    }

    public focusPrev(): void {
        this.contextMenuService.contextMenu.focusPrev();
    }

    public focusNext(): void {
        this.contextMenuService.contextMenu.focusNext();
    }

    public getFocus(): number {
        return this.contextMenuService.contextMenu.getFocus();
    }

    public getAction(indexOrID: number | string): MenuAction | undefined {
        return this.contextMenuService.contextMenu.getAction(indexOrID);
    }

    public tryOpenSubmenu(): boolean {
        return this.contextMenuService.contextMenu.tryOpenSubmenu();
    }

    public hasFocus(): boolean {
        return this.contextMenuService.contextMenu.hasFocus();
    }

    public destroy(): void {
        this.contextMenuService.contextMenu.destroy();
    }

    public runFocus(): void {
        this.contextMenuService.contextMenu.runFocus();
    }
}

// region - PaletteRenderer

class PaletteRenderer extends Disposable {

    private readonly _onMenuDestroy = this.__register(new Emitter<void>());
    public readonly onMenuDestroy = this._onMenuDestroy.registerListener;

    constructor(
        private readonly editorWidget: IEditorWidget,
        private readonly options: IEditorPaletteOptions,
        private readonly contextMenuService: IContextMenuService,
        private readonly i18nService: II18nService,
    ) {
        super();
    }

    public show(position?: IPosition): void {
        if (!position) {
            return;
        }
        const { overlayContainer: parentElement } = this.editorWidget.view.editor;

        this.contextMenuService.showContextMenuCustom({
            getActions: () => this.options.contentProvider(),
            getContext: () => undefined,
            getAnchor: () => ({ x: position.left, y: position.top, height: 24 }),
            getExtraContextMenuClassName: () => 'editor-palette',
            primaryAlignment: AnchorPrimaryAxisAlignment.Vertical,
            verticalPosition: AnchorVerticalPosition.Below,

            /**
             * We need to capture the blur event to prevent auto destroy. We 
             * will handle destruction by ourselves.
             */
            onBeforeDestroy: (cause) => {
                const shouldPrevent = cause === 'blur';
                return shouldPrevent;
            },
            // clean up
            onDestroy: () => {
                this._onMenuDestroy.fire();
            },
        }, parentElement);
    }
}

// region - PaletteKeyboardController

class PaletteKeyboardController implements IDisposable {
    
    private _ongoing?: IDisposable;

    private _triggeredNode?: {
        readonly pos: number;
        readonly depth: number;
        readonly nodeType: string;
    };

    constructor(
        private readonly editorWidget: IEditorWidget,
        private readonly palette: EditorPalette,
    ) {
        this._triggeredNode = undefined;
    }

    public dispose(): void {
        this._ongoing?.dispose();
        this._ongoing = undefined;
        this._triggeredNode = undefined;
    }

    public unlisten(): void {
        this.dispose();
    }

    /**
     * Invoked whenever a menu is rendererd, we handle the keyboard logic here.
     */
    public listen(view: ProseEditorView): void {
        this.__trackCurrentNode(view);

        this._ongoing?.dispose();
        const bucket = (this._ongoing = safeDisposable(new DisposableBucket()));

        /** 
         * Capture certain key down we handle it by ourselves.
         * @note Registered with {@link Priority.High} 
         */
        bucket.register(this.editorWidget.onKeydown(e => {
            const pressed = e.event.key;
            const captureKey = [
                KeyCode.UpArrow, 
                KeyCode.DownArrow,
                KeyCode.LeftArrow, 
                KeyCode.RightArrow,
                
                KeyCode.Escape,
                KeyCode.Enter,
            ];
            
            // do nothing if non-capture key pressed.
            if (!captureKey.includes(pressed)) {
                return false;
            }
            
            // escape: destroy the palette
            if (pressed === KeyCode.Escape) {
                this.palette.destroy();
            }
            // handle up/down arrows
            else if (pressed === KeyCode.UpArrow) {
                this.palette.focusPrev();
            } else if (pressed === KeyCode.DownArrow) {
                this.palette.focusNext();
            } 
            // handle right/left arrows
            else if (pressed === KeyCode.RightArrow || pressed === KeyCode.LeftArrow) {
                const index = this.palette.getFocus();
                const currAction = this.palette.getAction(index);
                if (!currAction || currAction.type !== MenuItemType.Submenu) {
                    return false;
                }
                
                if (pressed === KeyCode.RightArrow) {
                    const opened = this.palette.tryOpenSubmenu();
                    return opened;
                } else {
                    return false;
                }
            }
            // enter
            else if (pressed === KeyCode.Enter) {
                const hasFocus = this.palette.hasFocus();
                if (!hasFocus) {
                    this.palette.destroy();
                    return false;
                }
                this.palette.runFocus();
            }
            
            // make sure to re-focus back to editor
            view.focus();
            
            // tell the editor we handled this event, stop propagation.
            e.preventDefault();
            return true;
            
        }, undefined, Priority.High));

        /**
         * Whenever current textblock back to empty state, destroy the palette.
         */
        bucket.register(this.editorWidget.onDidContentChange(() => {
            const { $from } = view.state.selection;
            const isEmptyBlock = ProseTools.Node.isEmptyTextBlock($from.parent);
            if (isEmptyBlock) {
                this.palette.destroy();
            }
        }));

        /**
         * Destroy palette whenever the selection changes to other blocks.
         */
        bucket.register(this.editorWidget.onDidSelectionChange(e => {
            const menu = this.palette;
            const triggeredNode = this._triggeredNode;
            if (!triggeredNode) {
                return;
            }
            
            // obtain current selection's node info
            const currSelection = e.transaction.selection;
            const $current = currSelection.$from;
            const mappedPos = e.transaction.mapping.map(triggeredNode.pos);

            const isSameNode = (
                $current.parent.type.name === triggeredNode.nodeType &&
                $current.before() === mappedPos &&
                $current.depth === triggeredNode.depth
            );

            if (!isSameNode) {
                menu.destroy();
            }
        }));
    }

    private __trackCurrentNode(view: ProseEditorView): void {
        const { state } = view;
        const $pos = state.selection.$from;
        this._triggeredNode = {
            pos: $pos.before(),
            depth: $pos.depth,
            nodeType: $pos.parent.type.name,
        };
    }
}