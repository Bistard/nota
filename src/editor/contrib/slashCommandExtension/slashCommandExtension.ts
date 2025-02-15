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
import { Disposable, DisposableBucket, IDisposable } from "src/base/common/dispose";
import { KeyCode } from "src/base/common/keyboard";
import { ProseAttrs, ProseEditorView, ProseTextSelection } from "src/editor/common/proseMirror";
import { Emitter, Priority } from "src/base/common/event";
import { getTokenReadableName, Markdown, TokenEnum } from "src/editor/common/markdown";
import { II18nService } from "src/platform/i18n/browser/i18nService";
import { Arrays } from "src/base/common/utilities/array";
import { ErrorHandler } from "src/base/common/error";

interface IEditorSlashCommandExtension extends IEditorExtension {
    
    readonly id: EditorExtensionIDs.SlashCommand;
}

// region - EditorSlashCommandExtension

export class EditorSlashCommandExtension extends EditorExtension implements IEditorSlashCommandExtension {

    // [fields]

    public override readonly id = EditorExtensionIDs.SlashCommand;
    private readonly _menuRenderer: SlashMenuRenderer;
    private readonly _menuController: SlashMenuController;
    private readonly _keyboardController: SlashKeyboardController;

    constructor(
        editorWidget: IEditorWidget,
        @IContextMenuService contextMenuService: IContextMenuService,
        @II18nService i18nService: II18nService,
    ) {
        super(editorWidget);
        this._keyboardController = this.__register(new SlashKeyboardController(this, contextMenuService));
        this._menuController = new SlashMenuController(editorWidget);
        this._menuRenderer = this.__register(new SlashMenuRenderer(editorWidget, contextMenuService, i18nService));

        // slash-command rendering
        this.__register(this.onTextInput(e => {
            this.__tryShowSlashCommand(e);
        }));

        // always back to normal
        this.__register(this._menuRenderer.onMenuDestroy(() => {
            this._keyboardController.unlisten();
            editorWidget.view.editor.focus();
        }));

        // menu click logic
        this.__register(this._menuRenderer.onClick(e => {
            contextMenuService.contextMenu.destroy();
            this._menuController.onClick(e);
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
        this._menuRenderer.show(position);

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
        private readonly contextMenuService: IContextMenuService,
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
        const bucket = (this._ongoing = new DisposableBucket());

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
                this.contextMenuService.contextMenu.destroy();
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
                const currAction = this.contextMenuService.contextMenu.getAction(index);
                if (!currAction || currAction.type !== MenuItemType.Submenu) {
                    return false;
                }
                
                if (pressed === KeyCode.RightArrow) {
                    const opened = this.contextMenuService.contextMenu.tryOpenSubmenu();
                    return opened;
                } else {
                    return false;
                }
            }
            // enter
            else if (pressed === KeyCode.Enter) {
                const hasFocus = this.contextMenuService.contextMenu.hasFocus();
                if (!hasFocus) {
                    this.contextMenuService.contextMenu.destroy();
                    return false;
                }
                this.contextMenuService.contextMenu.runFocus();
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
                this.contextMenuService.contextMenu.destroy();
            }
        }));

        /**
         * Destroy slash command whenever the selection changes to other blocks.
         */
        bucket.register(this.extension.onDidSelectionChange(e => {
            const menu = this.contextMenuService.contextMenu;
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

// region - SlashMenuRenderer

type SlashOnClickEvent = {
    readonly type: string;
    readonly name: string;
    readonly attr: ProseAttrs;
};

class SlashMenuRenderer extends Disposable {

    private readonly _onMenuDestroy = this.__register(new Emitter<void>());
    public readonly onMenuDestroy = this._onMenuDestroy.registerListener;

    private readonly _onClick = this.__register(new Emitter<SlashOnClickEvent>());
    public readonly onClick = this._onClick.registerListener;

    constructor(
        private readonly editorWidget: IEditorWidget,
        private readonly contextMenuService: IContextMenuService,
        private readonly i18nService: II18nService,
    ) {
        super();
    }

    public show(position?: IPosition): void {
        if (!position) {
            return;
        }
        const editor = this.editorWidget.view.editor;
        const parentElement = editor.overlayContainer;

        this.contextMenuService.showContextMenuCustom({
            getActions: () => this.__obtainSlashCommandContent(),
            getContext: () => undefined,
            getAnchor: () => ({ x: position.left, y: position.top, height: 24 }),
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
                this._onMenuDestroy.fire();
            },
        }, parentElement);
    }

    private __obtainSlashCommandContent(): MenuAction[] {
        const nodes = this.__obtainValidContent();
        
        // convert each node into menu action
        return nodes.map(nodeName => {
            // heading: submenu
            if (nodeName === TokenEnum.Heading) {
                return this.__getHeadingActions();
            }
            // general case
            const resolvedName = getTokenReadableName(this.i18nService, nodeName);
            return new SimpleMenuAction({
                enabled: true,
                id: resolvedName,
                callback: () => this._onClick.fire({
                    type: nodeName,
                    name: resolvedName,
                    attr: {},
                }),    
            });
        });
    }

    private __obtainValidContent(): string[] {
        const blocks = this.editorWidget.model.getRegisteredDocumentNodes();
        const ordered = this.__filterContent(blocks, CONTENT_FILTER);
        return ordered;
    }
    
    private __filterContent(unordered: string[], expectOrder: string[]): string[] {
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
    
    private __getHeadingActions(): SubmenuAction {
        const heading = getTokenReadableName(this.i18nService, TokenEnum.Heading);
        return new SubmenuAction(
            Arrays.range(1, 7).map(level => this.__getHeadingAction(heading, level)),
            { enabled: true, id: heading }
        );
    }

    private __getHeadingAction(name: string, level: number): MenuAction {
        return new SimpleMenuAction({
            enabled: true,
            id: `${name} ${level}`,
            callback: () => this._onClick.fire({
                type: TokenEnum.Heading,
                name: name,
                attr: { level: level },
            }),
        });
    }
}

const CONTENT_FILTER = [
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

// region - SlashMenuController

class SlashMenuController {

    constructor(
        private readonly editorWidget: IEditorWidget,
    ) {}

    public onClick(event: SlashOnClickEvent): void {
        const { type, name, attr } = event;
        const view = this.editorWidget.view.editor.internalView;
        const state = view.state;
        let tr = state.tr;

        const prevStart = tr.selection.$from.start();
        const $pos = state.doc.resolve(prevStart);
        
        // create an empy node with given type
        const node = Markdown.Create.empty(state, type, attr);
        if (!node) {
            ErrorHandler.onUnexpectedError(new Error(`Cannot create node (${name})`));
            return;
        }

        // replace the current node with the new node
        tr = ProseTools.Position.replaceWithNode(state, $pos, node);

        // find next selectable text
        const newStart = tr.mapping.map(prevStart);
        const $newStart = tr.doc.resolve(newStart + 1);
        const selection = ProseTextSelection.findFrom($newStart, 1, true);
        if (selection) {
            tr = tr.setSelection(selection);
        }

        // update
        view.dispatch(tr);
    }
}