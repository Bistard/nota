import hljs from "highlight.js";
import { marked } from "marked";
import { EditorToken } from "src/editor/common/model";

/**
 * The options for markdown pasring.
 */
export interface IMarkdownLexerOptions {
    
    /**
     * A prefix url for any relative link.
     * @default undefined
     */
    baseURI?: string;

    /**
     * A string to prefix the className in a <code> block. Useful for syntax 
     * highlighting.
     * @default 'language-'
     */
    languagePrefix: string;

    /**
     * If enables code-block highlight functionality.
     * @default true
     */
    enableHighlight: boolean;
}

export function getDefaultLexerOptions(): IMarkdownLexerOptions {
    return {
        baseURI: undefined,
        languagePrefix: 'language-',
        enableHighlight: true,
    };
}

/**
 * An interface only for {@link MarkdownLexer}.
 */
export interface IMarkdownLexer {

    /**
     * @description Apply a lexical analysis on the given text and returns the 
     * analyzed tokens.
     * @param text The given text.
     * 
     * @note Each token index is relatives to the whole text model (absolute).
     */
    lex(text: string): EditorToken[];

    /**
     * @description Returns the current markdown lexer options.
     */
    getOptions(): IMarkdownLexerOptions;
}

export class MarkdownLexer implements IMarkdownLexer {

    // [field]

    private readonly _parseOpts: IMarkdownLexerOptions;
    
    private readonly _highlightFn?: Function;

    // [constructor]

    constructor(options?: IMarkdownLexerOptions) {
        this._parseOpts = options ?? getDefaultLexerOptions();
        
        if (this._parseOpts.enableHighlight) {
            this._highlightFn = this.__highlight.bind(this);
        }
    }

    // [public methods]

    public lex(text: string): EditorToken[] {
        
        const lexOption = <marked.MarkedOptions>{
            baseUrl: this._parseOpts.baseURI,
            langPrefix: this._parseOpts.languagePrefix,
            highlight: this._highlightFn,
        };

        const tokens = marked.lexer(text, lexOption);

        return tokens;
    }

    public getOptions(): IMarkdownLexerOptions {
        return this._parseOpts;
    }

    // [private helper methods]

    private __highlight(code: string, language: string): string {
        const lang = hljs.getLanguage(language) ? language : 'plaintext';
        const result = hljs.highlight(code, { language: lang });
        return result.value;
    }
}