import { MenuAction, SimpleMenuAction, SubmenuAction } from "src/base/browser/basic/menu/menuItem";
import { ErrorHandler } from "src/base/common/error";
import { Arrays } from "src/base/common/utilities/array";
import { Markdown, TokenEnum, getTokenReadableName } from "src/editor/common/markdown";
import { ProseAttrs, ProseTextSelection } from "src/editor/common/proseMirror";
import { ProseTools } from "src/editor/common/proseUtility";
import { IEditorWidget } from "src/editor/editorWidget";
import { II18nService } from "src/platform/i18n/browser/i18nService";

export class BlockInsertProvider {

    constructor(
        private readonly editorWidget: IEditorWidget,
        @II18nService private readonly i18nService: II18nService,
    ) {}

    // [public methods]

    public getContent(): MenuAction[] {
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
                callback: () => this.insertEmptyBlock({
                    type: nodeName,
                    name: resolvedName,
                    attr: {},
                }),
            });
        });
    }

    public insertEmptyBlock(event: OnBlockInsertEvent): void {
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

    // [private methods]

    private __obtainValidContent(): string[] {
        const blocks = this.editorWidget.viewModel.getRegisteredDocumentNodes();
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
            callback: () => this.insertEmptyBlock({
                type: TokenEnum.Heading,
                name: name,
                attr: { level: level },
            }),
        });
    }
}

type OnBlockInsertEvent = {
    readonly type: string;
    readonly name: string;
    readonly attr: ProseAttrs;
};

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