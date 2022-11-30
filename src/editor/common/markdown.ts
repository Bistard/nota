import { marked } from "src/editor/model/markdown/marked/marked";

/**
 * Those token types are identical to {@link marked.Tokens.type}.
 */
export const enum TokenEnum {
    Space = 'space',
    CodeBlock = 'code',
    Heading = 'heading',
    Table = 'table',
    HorizontalRule = 'hr',
    Blockquote = 'blockquote',
    List = 'list',
    ListItem = 'list_item',
    Paragraph = 'paragraph',
    HTML = 'html',
    Text = 'text',
    Def = 'def', // TODO
    Escape = 'escape',
    Image = 'image',
    LineBreak = 'br',
}

export const enum MarkEnum {
    Link = 'link',
    Strong = 'strong',
    Em = 'em',
    Codespan = 'codespan',
    // marked.Tokens.Tag // TODO
    Del = 'del', // TODO
}