import { AnchorPrimaryAxisAlignment, AnchorVerticalPosition } from "src/base/browser/basic/contextMenu/contextMenu";
import { MenuAction, MenuItemType, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { Disposable, DisposableBucket, IDisposable, safeDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Emitter, Priority } from "src/base/common/event";
import { KeyCode } from "src/base/common/keyboard";
import { Arrays } from "src/base/common/utilities/array";
import { IPosition } from "src/base/common/utilities/size";
import { getTokenReadableName, Markdown, TokenEnum } from "src/editor/common/markdown";
import { ProseAttrs, ProseEditorView, ProseTextSelection } from "src/editor/common/proseMirror";
import { ProseTools } from "src/editor/common/proseUtility";
import { EditorSlashCommandExtension } from "src/editor/contrib/slashCommand/slashCommand";
import { IEditorWidget } from "src/editor/editorWidget";
import { II18nService } from "src/platform/i18n/browser/i18nService";
import { IContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";

// region - BlockInsertPalette

/**
 * {@link BlockInsertPalette} A contextual command palette component that 
 * provides quick insertion of various document block types at the current 
 * cursor position. The palette renders as a vertical menu containing:
 * 
 * - Common block types (paragraphs, headings, code blocks etc.)
 * - Nested submenus for complex block variations
 * - Localized display names based on document schema
 */
export class BlockInsertPalette extends Disposable {

    // [event]

    get onMenuDestroy() { return this._menuRenderer.onMenuDestroy; }

    // [field]

    private readonly _menuRenderer: SlashMenuRenderer;
    private readonly _menuController: SlashMenuController;
    private readonly _keyboardController: SlashKeyboardController;

    // [constructor]

    constructor(
        private readonly editorWidget: IEditorWidget,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
        @II18nService i18nService: II18nService,
    ) {
        super();
        this._menuController = new SlashMenuController(editorWidget);
        this._menuRenderer = this.__register(new SlashMenuRenderer(editorWidget, contextMenuService, i18nService));
        this._keyboardController = this.__register(new SlashKeyboardController(editorWidget, this));

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

    // [public methods]

    public render(position: IPosition): void {
        this._menuRenderer.show(position);
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
        const { overlayContainer: parentElement } = this.editorWidget.view.editor;

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

// region - SlashKeyboardController

class SlashKeyboardController implements IDisposable {
    
    private _ongoing?: IDisposable;

    private _triggeredNode?: {
        readonly pos: number;
        readonly depth: number;
        readonly nodeType: string;
    };

    constructor(
        private readonly editorWidget: IEditorWidget,
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
        bucket.register(this.editorWidget.onDidContentChange(() => {
            const { $from } = view.state.selection;
            const isEmptyBlock = ProseTools.Node.isEmptyTextBlock($from.parent);
            if (isEmptyBlock) {
                this.palette.destroy();
            }
        }));

        /**
         * Destroy slash command whenever the selection changes to other blocks.
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