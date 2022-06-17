import { Triple } from "src/base/common/util/type";
import { IMarkdownLexer, IMarkdownLexerOptions, IMarkdownTokenizer, Markdown, MarkdownLexerDefaultOptions } from "src/editor/common/markdown";
// import { marked } from "src/editor/model/markdown/marked/marked";
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
        // const tokens = marked.lexer(text);
        // console.log(tokens);
        // REVIEW: testonly

        text = text.replace(/\r\n|\r/g, '\n'); // REVIEW: really needed?
        this.lexBlock(text, this._blockTokens);
        
        return this._blockTokens;
    }

    public pushInlineQueue(startIndex: number, textLength: number, tokenStore: Markdown.Token[]): void {
        this._inlineTokensQueue.push([startIndex, textLength, tokenStore]);
    }

    public lexBlock(text: string, tokenStore: Markdown.Token[]): Markdown.Token[] {

        const textLength = text.length;
        let cursor = 0;
        let token: Markdown.Token | null;

        while (cursor < textLength) {
            token = null;
            
            // external tokenizers
            token = this.__tryExternalTokenizers(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // space
            token = this._tokenizer.space(text, cursor);
            if (token) {
                if (token.textLength === 1 && tokenStore.length > 0) {
                    // a single LF is found, concate with the previous token.
                    tokenStore[tokenStore.length - 1]!.textLength += 1;
                } else {
                    tokenStore.push(token);
                    cursor += token.textLength;
                }
                continue;
            }

            // indentCode
            token = this._tokenizer.indentCode(text, cursor);
            if (token) {
                const prevToken = tokenStore[tokenStore.length - 1];
                // an indent code cannot interrupt from a paragraph.
                if (prevToken && (prevToken.type === Markdown.TokenType.PARAGRAPH || Markdown.TokenType.TEXT)) {
                    prevToken.textLength += 1 + token.textLength;
                    const prevInlineToken = this._inlineTokensQueue[this._inlineTokensQueue.length - 1]!;
                    prevInlineToken[0]! = prevToken.startIndex;
                    prevInlineToken[1]! = prevToken.textLength;
                } else {
                    tokenStore.push(token);
                    cursor += token.textLength;
                }
                continue;
            }

            // fenchCode
            token = this._tokenizer.fenchCode(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // heading
            token = this._tokenizer.heading(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // hr
            token = this._tokenizer.hr(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // blockquote
            token = this._tokenizer.blockQuote(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // list
            // html
            // def
            // table
            // lheading

            // paragraph
            token = this._tokenizer.paragraph(text, cursor);
            if (token) {
                const prevToken = tokenStore[tokenStore.length - 1];
                if (prevToken && (prevToken.type === Markdown.TokenType.PARAGRAPH)) {
                    prevToken.textLength += 1 + token.textLength;
                    this._inlineTokensQueue.pop();
                    const prevInlineToken = this._inlineTokensQueue[this._inlineTokensQueue.length - 1]!;
                    prevInlineToken[0]! = prevToken.startIndex;
                    prevInlineToken[1]! = prevToken.textLength;
                } else {
                    tokenStore.push(token);
                    cursor += token.textLength;
                }
                continue;
            }

            // text
            token = this._tokenizer.text(text, cursor);
            if (token) {
                // REVIEW: might need to combine with the prev one
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

            // error encounter
            if (this._opts.unknownTokenThrow === true) {
                throw new Error('unknown token reached');
            }
            break;
        }

        return tokenStore;
    }

    // [private helper methods]

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