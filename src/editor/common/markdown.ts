
export interface IMarkdownLexerOptions {

    /**
     * A prefix URL for relative links.
     */
    readonly baseURL?: string;

    /**
     * If throws an error if an unknown token is found.
     * @default true.
     */
    readonly unknownTokenThrow?: boolean;

    /**
     * An external tokenizer that determines extra behaviours how to tokenize 
     * the text.
     */
    readonly extensionTokenizers?: Markdown.External.IExternalTokenizer[];

}

export const MarkdownLexerDefaultOptions: IMarkdownLexerOptions = {
    unknownTokenThrow: true,
};

export namespace Markdown {

    export type Token = (
        Space |
        Code |
        Heading |
        Table |
        Hr |
        BlockQuote |
        List |
        ListItem |
        Paragraph |
        HTML |
        Text |
        Def |
        Escape |
        Tag |
        Image |
        Link |
        Strong |
        Emphasis |
        Codespan |
        Br |
        Del |
        Generic
    );

    export const enum TokenType {
        UNKNOWN = 0,
        SPACE,
        CODE,
        HEADING,
        TABLE,
        HR,
        BLOCK_QUOTE,
        LIST,
        LIST_ITEM,
        PARAGRAPH,
        HTML,
        TEXT,
        DEF,
        ESCAPE,
        TAG,
        LINK,
        IMAGE,
        STRONG,
        EMPHASIS,
        CODE_SPAN,
        BR,
        DEL,
        GENERIC,
    }

    /**
     * @internal
     */
    interface TokenBase<T extends TokenType> {
        readonly type: T;
        readonly startIndex: number;
        readonly textLength: number;
    }

    export interface Space extends TokenBase<TokenType.SPACE> {
        // nothing
    }

    export interface Code extends TokenBase<TokenType.CODE> {
        readonly lang: string;
    }

    export interface Heading extends TokenBase<TokenType.HEADING> {
        readonly depth: number;
        readonly tokens: Token[];
    }

    export interface Table extends TokenBase<TokenType.TABLE> {
        readonly align: AlignType[];
        readonly header: TableCell[];
        readonly content: TableCell[][];
    }

    const enum AlignType {
        NULL,
        CENTER,
        LEFT,
        RIGHT,
    }

    interface TableCell {
        readonly startIndex: number;
        readonly textLength: number;
        readonly tokens: Token[];
    }

    export interface Hr extends TokenBase<TokenType.HR> {
        // nothing
    }

    export interface BlockQuote extends TokenBase<TokenType.BLOCK_QUOTE> {
        readonly tokens: Token[];
    }

    export interface List extends TokenBase<TokenType.LIST> {
        readonly ordered: boolean;
        // start: number | ''
        // loose: boolean
        readonly items: ListItem[];
    }

    export interface ListItem extends TokenBase<TokenType.LIST_ITEM> {
        task: boolean
        checked?: boolean
        // loose: boolean
        readonly tokens: Token[];
    }

    export interface Paragraph extends TokenBase<TokenType.PARAGRAPH> {
        // pre?: boolean;
        readonly tokens: Token[];
    }

    export interface HTML extends TokenBase<TokenType.HTML> {
        // readonly pre: boolean;
    }

    export interface Text extends TokenBase<TokenType.TEXT> {
        readonly tokens: Token[];
    }

    export interface Def extends TokenBase<TokenType.DEF> {
        readonly tag: string;
        readonly href: string;
        readonly title: string;
    }

    export interface Escape extends TokenBase<TokenType.ESCAPE> {
        // nothing
    }

    export interface Tag extends TokenBase<TokenType.TAG> {
        readonly inLink: boolean;
        readonly inRawBlock: boolean;
    }

    export interface Link extends TokenBase<TokenType.LINK> {
        readonly title: string;
        readonly href: string;
        readonly tokens: Token[];
    }

    export interface Image extends TokenBase<TokenType.IMAGE> {
        readonly title: string;
        readonly href: string;
    }

    export interface Strong extends TokenBase<TokenType.STRONG> {
        readonly tokens: Token[];
    }

    export interface Emphasis extends TokenBase<TokenType.EMPHASIS> {
        readonly tokens: Token[];
    }

    export interface Codespan extends TokenBase<TokenType.CODE_SPAN> {
        // nothing
    }

    export interface Br extends TokenBase<TokenType.BR> {
        // nothing
    }

    export interface Del extends TokenBase<TokenType.DEL> {
        readonly tokens: Token[];
    }

    export interface Generic extends TokenBase<TokenType.GENERIC> {
        readonly [index: string]: any;
        readonly tokens?: Token[];
    }

    export namespace External {
        
        export interface IExternalTokenizer {
            token(lexer: IMarkdownLexer, text: string, cursor: number, tokensStore: Token[]): Token | null;
        }
        
    }
}

/**
 * An interface only for {@link MarkdownLexer}.
 */
export interface IMarkdownLexer {

    lex(text: string): Markdown.Token[];
    lexBlock(text: string, tokensStore: Markdown.Token[]): Markdown.Token[];
    pushInlineQueue(startIndex: number, textLength: number, tokenStore: Markdown.Token[]): void;
}

/**
 * An interface only for {@link MarkdownTokenizer}.
 */
export interface IMarkdownTokenizer {

    space(text: string, cursor: number): Markdown.Space | null;
    indentCode(text: string, cursor: number): Markdown.Code | null;
    fenchCode(text: string, cursor: number): Markdown.Code | null;
    heading(text: string, cursor: number): Markdown.Heading | null;
    hr(text: string, cursor: number): Markdown.Hr | null;
    blockQuote(text: string, cursor: number): Markdown.BlockQuote | null;

    paragraph(text: string, cursor: number): Markdown.Paragraph | null;
    text(text: string, cursor: number): Markdown.Text | null;

}