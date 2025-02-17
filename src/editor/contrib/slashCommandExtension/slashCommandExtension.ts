import "src/editor/contrib/slashCommandExtension/slashCommand.scss";
import { MenuItemType } from "src/base/browser/basic/menu/menuItem";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";
import { DisposableBucket, IDisposable, safeDisposable } from "src/base/common/dispose";
import { KeyCode } from "src/base/common/keyboard";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { Priority } from "src/base/common/event";
import { BlockInsertPalette } from "src/editor/view/widget/blockInsertPalette/blockInsertPlette";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

interface IEditorSlashCommandExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.SlashCommand;
}

// region - EditorSlashCommandExtension

export class EditorSlashCommandExtension extends EditorExtension implements IEditorSlashCommandExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.SlashCommand;

    private readonly _palette: BlockInsertPalette;
    private readonly _keyboardController: SlashKeyboardController;

    constructor(
        editorWidget: IEditorWidget,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super(editorWidget);
        this._palette = this.__register(instantiationService.createInstance(BlockInsertPalette, editorWidget));
        this._keyboardController = this.__register(new SlashKeyboardController(this, this._palette));

        // slash-command rendering
        this.__register(this.onTextInput(e => {
            this.__tryShowSlashCommand(e);
        }));

        this.__register(this._palette.onMenuDestroy(() => {
            this._keyboardController.unlisten();
        }));
    }

    // [private methods]

    private __tryShowSlashCommand(e: IOnTextInputEvent): void {
        const { text, view } = e;
        const { selection } = view.state;

        const isCursor = ProseTools.Cursor.isCursor(selection);
        if (!isCursor) {
            return;
        }

        const isEmptyBlock = ProseTools.Cursor.isOnEmpty(selection);
        const isSlash = text === '/';
        if (!isEmptyBlock || !isSlash) {
            return;
        }

        // show slash command
        const position = view.coordsAtPos(selection.$from.pos);
        this._palette.render(position);

        // re-focus back to editor, not the slash command.
        view.focus();

        // slash command shown, we capture certain key press.
        this._keyboardController.listen(view);
    }
}

// region - SlashKeyboardController

class SlashKeyboardController implements IDisposable {
    
    private _ongoing?: IDisposable;

    private _triggeredNode?: {
        readonly pos: number;
        readonly depth: number;
        readonly nodeType: string;
    };

    constructor(
        private readonly extension: EditorSlashCommandExtension,
        private readonly palette: BlockInsertPalette,
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
        bucket.register(this.extension.onKeydown(e => {
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
            
            // escape: destroy the slash command
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
         * Whenever current textblock back to empty state, destroy the slash 
         * command.
         */
        bucket.register(this.extension.onDidContentChange(() => {
            const { $from } = view.state.selection;
            const isEmptyBlock = ProseTools.Node.isEmptyTextBlock($from.parent);
            if (isEmptyBlock) {
                this.palette.destroy();
            }
        }));

        /**
         * Destroy slash command whenever the selection changes to other blocks.
         */
        bucket.register(this.extension.onDidSelectionChange(e => {
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