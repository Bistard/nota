import "src/editor/contrib/slashCommandExtension/slashCommand.scss";
import { AnchorPrimaryAxisAlignment, AnchorVerticalPosition, IContextMenu } from "src/base/browser/basic/contextMenu/contextMenu";
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
import { ProseEditorView, ProseSelection } from "src/editor/common/proseMirror";
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
    private readonly _keyboardController: SlashKeyboardController;

    constructor(
        editorWidget: IEditorWidget,
        @IContextMenuService contextMenuService: IContextMenuService,
        @II18nService i18nService: II18nService,
    ) {
        super(editorWidget);
        this._keyboardController = this.__register(new SlashKeyboardController(this, contextMenuService));
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

    constructor(
        private readonly extension: EditorSlashCommandExtension,
        private readonly contextMenuService: IContextMenuService,
    ) {}

    public dispose(): void {
        this._ongoing?.dispose();
        this._ongoing = undefined;
    }

    public unlisten(): void {
        this.dispose();
    }

    public listen(view: ProseEditorView): void {
        this._ongoing?.dispose();
        const bucket = (this._ongoing = new DisposableBucket());

        /** Registered with {@link Priority.High} */
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
                return;
            }
            
            // captured the keydown event, we handle it by ourselves.
            e.preventDefault();
            e.event.preventDefault();

            // escape: destroy the slash command
            if (pressed === KeyCode.Escape) {
                this.contextMenuService.contextMenu.destroy();
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
}

// region - SlashMenuRenderer

class SlashMenuRenderer extends Disposable {

    private readonly _onMenuDestroy = this.__register(new Emitter<void>());
    public readonly onMenuDestroy = this._onMenuDestroy.registerListener;

    private readonly _onClick = this.__register(new Emitter<string>());
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
        const x = position.left;
        const y = position.top + 30; // add a bit offset to the bottom

        const parentElement = editor.container;
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
                callback: () => {
                    const view = this.editorWidget.view.editor.internalView;
                    const state = view.state;
                    let tr = state.tr;
    
                    // 1) 找到当前光标所在行（block）的起止位置
                    const $pos = state.selection.$from;
                    const startOfLine = $pos.start();
                    const endOfLine = $pos.end();
    
                    // 2) 删除当前行所有文本
                    tr.deleteRange(startOfLine, endOfLine);
    
                    // 3) 创建要插入的空节点
                    const node = Markdown.Create.empty(state, nodeName, {});
                    if (!node) {
                        ErrorHandler.onUnexpectedError(new Error(`Cannot create node (${resolvedName})`));
                        return;
                    }

                    // 4) 用新建的空节点替换（由于上一步已经把当前行清空, 
                    //    可以直接基于当前 selection 替换插入）
                    // TODO: insert to a new block
                    tr = ProseTools.Selection.replaceWithNode(tr, node);

                    // 假设我们删除了当前行后，用 replaceWithNode 插入了新节点。
                    // newNodePos 即该节点插入后在文档中的位置。例如如果删除区间是 [start, end]，
                    // 新插入节点通常会出现在 start 位置:
                    const newNodePos = startOfLine;

                    // 这里将 selection 往后找第一个可编辑的位置，
                    // 第三个参数若支持 textOnly(或其它配置) 可根据需求设置。
                    // 不同 ProseMirror 版本/封装库可能略有差异。
                    const $resolvedPos = tr.doc.resolve(newNodePos + 1);
                    const textSelection = ProseSelection.findFrom($resolvedPos, 1 /*搜索方向*/, true /*仅文本块*/);

                    // 如果找到了合适的位置，就设置 selection:
                    if (textSelection) {
                        tr = tr.setSelection(textSelection);
                    }
    
                    // 6) dispatch 更新视图
                    view.dispatch(tr);
    
                    // (可选) 再次 focus
                    view.focus();
                },    
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
            callback: () => {
                const view = this.editorWidget.view.editor.internalView;
                const state = view.state;
                const node = Markdown.Create.empty(state, TokenEnum.Heading, { level: level });

                const prevFrom = state.tr.selection.from;
                let tr = ProseTools.Selection.replaceWithNode(state.tr, node);

                const $resolvedPos = tr.doc.resolve(prevFrom + 1);
                const textSelection = ProseSelection.findFrom($resolvedPos, 1, true);
                if (textSelection) {
                    tr = tr.setSelection(textSelection);
                }

                view.dispatch(tr);
            },
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