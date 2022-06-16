
export interface IMarkdownLexerOptions {

    /**
     * A prefix URL for relative links.
     */
    readonly baseURL?: string;

    /**
     * An external tokenizer that determines extra behaviours how to tokenize 
     * the text.
     */
    readonly extensionTokenizers?: Markdown.External.IExternalTokenizer[];

}

export const MarkdownLexerDefaultOptions: IMarkdownLexerOptions = {

};

export namespace Markdown {

    export interface Rules {
        [ruleName: string]: RegExp;
    }

    export type Token = (
        Space |
        code |
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
        Link |
        Image |
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
    }

    export interface Space extends TokenBase<TokenType.SPACE> {
        // nothing
    }

    export interface code extends TokenBase<TokenType.CODE> {
        readonly text: string;
        readonly lang?: string;
    }

    export interface Heading extends TokenBase<TokenType.HEADING> {
        readonly text: string;
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
        readonly text: string; // REVIEW: is this needed?
        readonly tokens: Token[];
    }

    export interface Hr extends TokenBase<TokenType.HR> {
        // nothing
    }

    export interface BlockQuote extends TokenBase<TokenType.BLOCK_QUOTE> {
        readonly text: string;
        readonly tokens: Token[];
    }

    export interface List extends TokenBase<TokenType.LIST> {
        readonly ordered: boolean;
        // start: number | ''
        // loose: boolean
        readonly items: ListItem[];
    }

    export interface ListItem extends TokenBase<TokenType.LIST_ITEM> {
        readonly text: string;
        task: boolean
        checked?: boolean
        // loose: boolean
        readonly tokens: Token[];
    }

    export interface Paragraph extends TokenBase<TokenType.PARAGRAPH> {
        readonly text: string;
        // pre?: boolean;
        readonly tokens: Token[];
    }

    export interface HTML extends TokenBase<TokenType.HTML> {
        readonly text: string;
        // readonly pre: boolean;
    }

    export interface Text extends TokenBase<TokenType.TEXT> {
        readonly text: string;
        readonly token?: Token[];
    }

    export interface Def extends TokenBase<TokenType.DEF> {
        readonly tag: string;
        readonly href: string;
        readonly title: string;
    }

    export interface Escape extends TokenBase<TokenType.ESCAPE> {
        readonly text: string;
    }

    export interface Tag extends TokenBase<TokenType.TAG> {
        readonly text: string;
        readonly inLink: boolean;
        readonly inRawBlock: boolean;
    }

    export interface Link extends TokenBase<TokenType.LINK> {
        readonly text: string;
        readonly title: string;
        readonly href: string;
        readonly tokens: Token[];
    }

    export interface Image extends TokenBase<TokenType.IMAGE> {
        readonly text: string;
        readonly title: string;
        readonly href: string;
    }

    export interface Strong extends TokenBase<TokenType.STRONG> {
        readonly text: string;
        readonly tokens: Token[];
    }

    export interface Emphasis extends TokenBase<TokenType.EMPHASIS> {
        readonly text: string;
        readonly tokens: Token[];
    }

    export interface Codespan extends TokenBase<TokenType.CODE_SPAN> {
        readonly text: string;
    }

    export interface Br extends TokenBase<TokenType.BR> {
        // nothing
    }

    export interface Del extends TokenBase<TokenType.DEL> {
        readonly text: string;
        readonly tokens: Token[];
    }

    export interface Generic extends TokenBase<TokenType.GENERIC> {
        readonly [index: string]: any;
        readonly raw: string;
        readonly tokens?: Token[];
    }

    export interface TokenResult {
        /**
         * The created token.
         */
        token: Token;
        /**
         * The raw text length of the token.
         */
        rawLength: number;
    }

    export namespace External {
        
        export interface IExternalTokenizer {
            token(lexer: IMarkdownLexer, text: string, cursor: number, tokensStore: Markdown.Token[]): TokenResult | null;
        }
        
    }
}

/**
 * An interface only for {@link MarkdownLexer}.
 */
export interface IMarkdownLexer {

    lex(text: string): Markdown.Token[];
    
}

/**
 * An interface only for {@link MarkdownTokenizer}.
 */
export interface IMarkdownTokenizer {

}