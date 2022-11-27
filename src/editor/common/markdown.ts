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
    List = 'list', // TODO
    ListItem = 'list_item', // TODO
    Paragraph = 'paragraph',
    HTML = 'html', // TODO
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