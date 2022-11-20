/**
 * Those token types are identical to {@link marked.Tokens.type}.
 */
export const enum TokenEnum {
    Space = 'space', // TODO
    CodeBlock = 'code',
    Heading = 'heading',
    Table = 'table',
    HorizontalRule = 'hr',
    Blockquote = 'blockquote',
    List = 'list', // TODO
    ListItem = 'list_item', // TODO
    Paragraph = 'paragraph',
    HTML = 'html', // TODO
    Text = 'text',
    Def = 'def', // TODO
    Escape = 'escape',
    Image = 'image',
    LineBreak = 'br', // TODO
}

export const enum MarkEnum {
    // marked.Tokens.Tag // TODO
    Link = 'link',
    Strong = 'strong',
    Em = 'em',
    CodeInline = 'codespan',
    Del = 'del', // TODO
}