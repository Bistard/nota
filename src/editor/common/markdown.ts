import type { II18nService } from "src/platform/i18n/browser/i18nService";

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
        [TokenEnum.Space]: i18n.localize('space', 'Space'),
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