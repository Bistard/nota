import "src/editor/contrib/slashCommandExtension/slashCommand.scss";
import { AnchorPrimaryAxisAlignment, AnchorVerticalPosition } from "src/base/browser/basic/contextMenu/contextMenu";
import { MenuAction, MenuItemType, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { IPosition } from "src/base/common/utilities/size";
import { EditorExtension, IEditorExtension } from "src/editor/common/editorExtension";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorExtensionIDs } from "src/editor/contrib/builtInExtensionList";
import { IEditorWidget } from "src/editor/editorWidget";
import { IOnTextInputEvent } from "src/editor/view/proseEventBroadcaster";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { DisposableBucket } from "src/base/common/dispose";
import { KeyCode } from "src/base/common/keyboard";
import { ProseEditorView } from "src/editor/common/proseMirror";
import { Priority } from "src/base/common/event";
import { getTokenReadableName, TokenEnum } from "src/editor/common/markdown";
import { II18nService } from "src/platform/i18n/browser/i18nService";
import { Arrays } from "src/base/common/utilities/array";

interface IEditorSlashCommandExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.SlashCommand;
}

export class EditorSlashCommandExtension extends EditorExtension implements IEditorSlashCommandExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.SlashCommand;

    /** ongoing lifecycles when the slash command is on. */
    private _ongoingBucket?: DisposableBucket;

    constructor(
        editorWidget: IEditorWidget,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
        @II18nService private readonly i18nService: II18nService,
    ) {
        super(editorWidget);

        // slash-command rendering
        this.__register(this.onTextInput(e => {
            this.__tryShowSlashCommand(e);
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
        this.__showSlashCommand(position);

        // re-focus back to editor, not the slash command.
        view.focus();

        // slash command shown, we capture certain key press.
        this.__registerKeyboardHandlers(view);
    }

    private __showSlashCommand(position?: IPosition): void {
        if (!position) {
            return;
        }
        const x = position.left;
        const y = position.top + 30; // add a bit offset to the bottom

        const parentElement = this._editorWidget.view.editor.container;
        this.contextMenuService.showContextMenuCustom({
            getActions: () => this.__obtainSlashCommandContent(),
            getContext: () => undefined,
            getAnchor: () => ({ x, y }), // FIX: use element
            getExtraContextMenuClassName: () => 'editor-slash-command',
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
                this.__releaseKeyboardHandlers();
            },
        }, parentElement);
    }

    private __registerKeyboardHandlers(view: ProseEditorView): void {
        this.release(this._ongoingBucket);
        this._ongoingBucket = this.__register(new DisposableBucket());

        /** Registered with {@link Priority.High} */
        this._ongoingBucket.register(this.onKeydown(e => {
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
                return;
            }
            
            // captured the keydown event, we handle it by ourselves.
            e.preventDefault();
            e.event.preventDefault();

            // escape: destroy the slash command
            if (pressed === KeyCode.Escape) {
                this.contextMenuService.contextMenu.destroy();
                view.focus();
                return true;
            }

            // handle up/down arrows
            else if (pressed === KeyCode.UpArrow) {
                this.contextMenuService.contextMenu.focusPrev();
            } else if (pressed === KeyCode.DownArrow) {
                this.contextMenuService.contextMenu.focusNext();
            } 
            // handle right/left arrows
            else if (pressed === KeyCode.RightArrow || pressed === KeyCode.LeftArrow) {
                const index = this.contextMenuService.contextMenu.getFocus();
                if (index === -1) {
                    return false;
                }
                const currAction = this.contextMenuService.contextMenu.getAction(index);
                if (!currAction) {
                    return false;
                }
                if (currAction.type !== MenuItemType.Submenu) {
                    return false;
                }
                
                if (pressed === KeyCode.RightArrow) {
                    // TODO
                    const opened = this.contextMenuService.contextMenu.tryOpenSubmenu();
                    return opened;
                } else {
                    // TODO
                    return false;
                }
            }
            // enter
            else if (pressed === KeyCode.Enter) {
                const hasFocus = this.contextMenuService.contextMenu.hasFocus();
                if (!hasFocus) {
                    this.contextMenuService.contextMenu.destroy();
                    view.focus();
                    return false; // do not handle it since no focusing item
                }
                this.contextMenuService.contextMenu.runFocus();
            }
            
            // make sure to re-focus back to editor
            view.focus();
            
            // tell the editor we handled this event, stop propagation.
            return true;
        }, undefined, Priority.High));

        // todo: when back to empty block, also destroy the slash command

        // todo: every contextMenu onFocus, need refocus editor
    }

    private __releaseKeyboardHandlers(): void {
        this.release(this._ongoingBucket);
        this._ongoingBucket = undefined;
    }

    private __obtainSlashCommandContent(): MenuAction[] {
        const nodes = __obtainValidContent(this._editorWidget);
        
        // convert each node into menu action
        return nodes.map(name => {
            
            // heading: submenu
            if (name === TokenEnum.Heading) {
                return __getHeadingActions(this.i18nService);
            }

            // general case
            return new SimpleMenuAction({
                enabled: true,
                id: getTokenReadableName(this.i18nService, name),
                callback: () => {
                    // todo: insert actual block
                },
            });
        });
    }
}

// region - [private]

const CONTENT_PRIORITY = [
    TokenEnum.Paragraph,
    TokenEnum.Blockquote,
    TokenEnum.Heading,
    TokenEnum.Image,
    TokenEnum.List,
    TokenEnum.Table,
    TokenEnum.CodeBlock,
    TokenEnum.MathBlock,
    TokenEnum.HTML,
    TokenEnum.HorizontalRule,
];

function __obtainValidContent(editor: IEditorWidget): string[] {
    const blocks = editor.model.getRegisteredDocumentNodes();
    const ordered = __reorderAndFilterContent(blocks, CONTENT_PRIORITY);
    return ordered;
}

function __reorderAndFilterContent(unordered: string[], expectOrder: string[]): string[] {
    const ordered: string[] = [];
    const unorderedSet = new Set(unordered);
    for (const name of expectOrder) {
        if (unorderedSet.has(name)) {
            ordered.push(name);
            unorderedSet.delete(name);
        } else {
            console.warn(`[SlashCommandExtension] missing node: ${name}`);
        }
    }
    return ordered;
}

function __getHeadingActions(i18nService: II18nService): SubmenuAction {
    const heading = getTokenReadableName(i18nService, TokenEnum.Heading);
    return new SubmenuAction(
        Arrays.range(1, 7).map(level => new SimpleMenuAction({
            enabled: true,
            id: `${heading} ${level}`,
            callback: () => {}, // TODO
        })),
        {
            enabled: true,
            id: heading,
        }
    );
}