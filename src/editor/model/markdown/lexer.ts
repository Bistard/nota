import { Pair } from "src/base/common/util/type";
import { IMarkdownLexer, IMarkdownLexerOptions, IMarkdownTokenizer, Markdown, MarkdownLexerDefaultOptions } from "src/editor/common/markdown";
import { marked } from "src/editor/model/markdown/marked/marked";
import { MarkdownTokenizer } from "src/editor/model/markdown/tokenizer";


export class MarkdownLexer implements IMarkdownLexer {

    // [field]

    private _opts: IMarkdownLexerOptions;

    private readonly _blockTokens: Markdown.Token[];
    private readonly _inlineTokens: Pair<string, Markdown.Token[]>[];

    private readonly _tokenizer: IMarkdownTokenizer;

    // [constructor]

    constructor(opts?: IMarkdownLexerOptions) {
        this._opts = opts || MarkdownLexerDefaultOptions;
        this._blockTokens = [];
        this._inlineTokens = [];
        this._tokenizer = new MarkdownTokenizer();
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

    // [private helper methods]

    private __lexBlockTokens(text: string): void {

        const textLength = text.length;
        let cursor = 0;
        let tokenResult: Markdown.TokenResult | null;

        while (cursor < textLength) {
            
            // external tokenizers
            tokenResult = this.__tryExternalTokenizers(text, cursor);
            if (tokenResult !== null) {
                this._blockTokens.push(tokenResult.token);
                cursor += tokenResult.rawLength;
                continue;
            }

            tokenResult = null;
        }

        
    }

    /**
     * @description If provided any external tokenizers, we try to analysis them
     * with the given text. Returns a {@link Markdown.TokenResult} if a token is
     * matched.
     */
    private __tryExternalTokenizers(text: string, cursor: number): Markdown.TokenResult | null {
        if (!this._opts.extensionTokenizers) {
            return null;
        }
        
        const tokenizers = this._opts.extensionTokenizers;
        let result: Markdown.TokenResult | null = null;
        
        for (let i = 0; i < tokenizers.length; i++) {    
            const tokenizer = tokenizers[i]!;
            
            result = tokenizer.token(this, text, cursor, this._blockTokens);
            if (result !== null) {
                return result;
            }
        }

        return null;
    }

}