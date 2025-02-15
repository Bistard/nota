import type { ProseAttrs, ProseEditorState, ProseNode } from "src/editor/common/proseMirror";
import type { BlockquoteAttrs } from "src/editor/model/documentNode/node/blockquote";
import type { CodeBlockAttrs } from "src/editor/model/documentNode/node/codeBlock/codeBlock";
import type { HeadingAttrs } from "src/editor/model/documentNode/node/heading";
import type { HorizontalRuleAttrs } from "src/editor/model/documentNode/node/horizontalRule";
import type { HTMLAttrs } from "src/editor/model/documentNode/node/html/html";
import type { ImageAttrs } from "src/editor/model/documentNode/node/image";
import type { ListAttrs } from "src/editor/model/documentNode/node/list";
import type { MathBlockAttrs } from "src/editor/model/documentNode/node/mathBlock";
import type { ParagraphAttrs } from "src/editor/model/documentNode/node/paragraph";
import type { II18nService } from "src/platform/i18n/browser/i18nService";
import { ProseTools } from "src/editor/common/proseUtility";

/**
 * Those token types are identical to {@link marked.Tokens.type}.
 */
export const enum TokenEnum {
    Space = 'space',
    CodeBlock = 'code',
    Heading = 'heading',
    Table = 'table', // TODO
    HorizontalRule = 'hr',
    Blockquote = 'blockquote',
    List = 'list',
    ListItem = 'list_item',
    Paragraph = 'paragraph',
    HTML = 'html',
    InlineHTML = 'inline_html',
    Text = 'text',
    Def = 'def', // TODO
    Escape = 'escape',
    Image = 'image',
    LineBreak = 'br',
    MathBlock = 'mathBlock',
    MathInline = 'mathInline',
}

export const enum MarkEnum {
    Link = 'link',
    Strong = 'strong',
    Em = 'em',
    Codespan = 'codespan',
    // marked.Tokens.Tag // TODO
    Del = 'del', // TODO
}

let TOKEN_READABLE_NAMES: Record<string, string> | undefined = undefined;
export function getTokenReadableName(i18n: II18nService, token: string | TokenEnum): string {
    if (TOKEN_READABLE_NAMES) {
        return TOKEN_READABLE_NAMES[token] ?? 'UNKNOWN';
    }

    TOKEN_READABLE_NAMES = {
        [TokenEnum.CodeBlock]: i18n.localize('code', 'Code'),
        [TokenEnum.Heading]: i18n.localize('heading', 'Heading'),
        [TokenEnum.Table]: i18n.localize('table', 'Table'),
        [TokenEnum.HorizontalRule]: i18n.localize('horizontalRule', 'Divider'),
        [TokenEnum.Blockquote]: i18n.localize('blockquote', 'Quote'),
        [TokenEnum.List]: i18n.localize('list', 'List'),
        [TokenEnum.Paragraph]: i18n.localize('paragraph', 'Paragraph'),
        [TokenEnum.HTML]: i18n.localize('html', 'HTML'),
        [TokenEnum.Image]: i18n.localize('image', 'Image'),
        [TokenEnum.MathBlock]: i18n.localize('mathBlock', 'Math'),
    };

    return TOKEN_READABLE_NAMES[token] ?? 'UNKNOWN';
}

export namespace Markdown {
    export namespace Create {
        export const empty = __createEmptyNodeByType;
    }
}

let cached: Record<string, (state: ProseEditorState, attr: ProseAttrs) => ProseNode>;

/**
 * @description Construct an empty node by the given `type`.
 * @returns `undefined` if the `type` is invalid.
 */
function __createEmptyNodeByType(state: ProseEditorState, type: string, attr: ProseAttrs): ProseNode | undefined {
    cached ??= {
        [TokenEnum.Heading]: __createHeading,
        [TokenEnum.Paragraph]: __createParagraph,
        [TokenEnum.Image]: __createImage,
        [TokenEnum.CodeBlock]: __createCodeBlock,
        [TokenEnum.MathBlock]: __createMathBlock,
        [TokenEnum.HTML]: __createHTML,
        [TokenEnum.HorizontalRule]: __createHorizontalRule,
        [TokenEnum.Blockquote]: __createBlockquote,
        [TokenEnum.List]: __createList,
    };

    const ctor = cached[type];
    if (!ctor) {
        return undefined;
    }
    return ctor(state, attr);
}

function __createHeading(state: ProseEditorState, attr: HeadingAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.Heading, attr);
}

function __createParagraph(state: ProseEditorState, attr: ParagraphAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.Paragraph, attr);
}

function __createBlockquote(state: ProseEditorState, attr: BlockquoteAttrs): ProseNode {
    return ProseTools.Node.createNode(
        state, 
        TokenEnum.Blockquote, 
        attr,
        __createParagraph(state, {}),
    );
}

function __createImage(state: ProseEditorState, attr: ImageAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.Image, attr);
}

function __createList(state: ProseEditorState, attr: ListAttrs): ProseNode {
    return ProseTools.Node.createNode(
        state, 
        TokenEnum.List, 
        attr,
        ProseTools.Node.createNode(
            state, 
            TokenEnum.ListItem, 
            {},
            __createParagraph(state, {}),
        )
    );
}

function __createCodeBlock(state: ProseEditorState, attr: CodeBlockAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.CodeBlock, attr);
}

function __createMathBlock(state: ProseEditorState, attr: MathBlockAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.MathBlock, attr);
}

function __createHTML(state: ProseEditorState, attr: HTMLAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.HTML, attr);
}

function __createHorizontalRule(state: ProseEditorState, attr: HorizontalRuleAttrs): ProseNode {
    return ProseTools.Node.createNode(state, TokenEnum.HorizontalRule, attr);
}
