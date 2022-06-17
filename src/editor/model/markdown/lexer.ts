import { Triple } from "src/base/common/util/type";
import { IMarkdownLexer, IMarkdownLexerOptions, IMarkdownTokenizer, Markdown, MarkdownLexerDefaultOptions } from "src/editor/common/markdown";
import { marked } from "src/editor/model/markdown/marked/marked";
import { MarkdownTokenizer } from "src/editor/model/markdown/tokenizer";


export class MarkdownLexer implements IMarkdownLexer {

    // [field]

    private _opts: IMarkdownLexerOptions;

    private readonly _blockTokens: Markdown.Token[];
    private readonly _inlineTokensQueue: Triple<number, number, Markdown.Token[]>[];

    private readonly _tokenizer: IMarkdownTokenizer;

    // [constructor]

    constructor(opts?: IMarkdownLexerOptions) {
        this._opts = opts || MarkdownLexerDefaultOptions;
        this._blockTokens = [];
        this._inlineTokensQueue = [];
        this._tokenizer = new MarkdownTokenizer(this);
    }

    // [public method]

    public lex(text: string): Markdown.Token[] {
        
        // REVIEW: testonly
        const tokens = marked.lexer(text);
        console.log(tokens);
        // REVIEW: testonly

        text = text.replace(/\r\n|\r/g, '\n'); // REVIEW: really needed?

        this.__lexBlockTokens(text);
        
        return [];
    }

    public pushInlineQueue(startIndex: number, textLength: number, tokenStore: Markdown.Token[]): void {
        this._inlineTokensQueue.push([startIndex, textLength, tokenStore]);
    }

    // [private helper methods]

    private __lexBlockTokens(text: string): void {

        const textLength = text.length;
        let cursor = 0;
        let token: Markdown.Token | null;

        while (cursor < textLength) {
            
            // external tokenizers
            token = this.__tryExternalTokenizers(text, cursor);
            if (token) {
                this._blockTokens.push(token);
                cursor += token.textLength;
                continue;
            }

            // text
            token = this._tokenizer.text(text, cursor);
            if (token) {
                this._blockTokens.push(token);
                cursor += token.textLength;
                continue;
            }

            // space
            token = this._tokenizer.space(text, cursor);
            if (token) {
                this._blockTokens.push(token);
                cursor += token.textLength;
                continue;
            }

            token = null;
        }

        
    }

    /**
     * @description If provided any external tokenizers, we try to analysis them
     * with the given text. Returns a {@link Markdown.TokenResult} if a token is
     * matched.
     */
    private __tryExternalTokenizers(text: string, cursor: number): Markdown.Token | null {
        if (!this._opts.extensionTokenizers) {
            return null;
        }
        
        const tokenizers = this._opts.extensionTokenizers;
        let token: Markdown.Token | null = null;
        
        for (let i = 0; i < tokenizers.length; i++) {    
            const tokenizer = tokenizers[i]!;
            
            token = tokenizer.token(this, text, cursor, this._blockTokens);
            if (token !== null) {
                return token;
            }
        }

        return null;
    }

}