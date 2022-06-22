import { Triple } from "src/base/common/util/type";
import { IMarkdownLexer, IMarkdownLexerOptions, IMarkdownTokenizer, Markdown, MarkdownLexerDefaultOptions } from "src/editor/common/markdown";
import { MarkdownTokenizer } from "src/editor/model/markdown/tokenizer";

type Token = Markdown.Token;

export class MarkdownLexer implements IMarkdownLexer {

    // [field]

    private _opts: IMarkdownLexerOptions;

    private readonly _blockTokens: Token[];
    private readonly _inlineTokensQueue: Triple<number, number, Token[]>[];

    private readonly _tokenizer: IMarkdownTokenizer;

    // [constructor]

    constructor(opts?: IMarkdownLexerOptions) {
        this._opts = opts || MarkdownLexerDefaultOptions;
        this._blockTokens = [];
        this._inlineTokensQueue = [];
        this._tokenizer = new MarkdownTokenizer(
            (...args) => this.__pushInlineQueue(...args), 
            (...args) => this.__lexBlock(...args)
        );
    }

    // [public method]

    public lex(text: string, offset: number = 0): Token[] {
        
        text = text.replace(/\r\n|\r/g, '\n'); // REVIEW: really needed?
        this.__lexBlock(text, this._blockTokens);
        
        return this._blockTokens;
    }

    // [private helper methods]

    private __lexBlock(text: string, tokenStore: Token[]): Token[] {

        const textLength = text.length;
        let cursor = 0;
        let token: Token | null;

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
                    cursor += 1;
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
            token = this._tokenizer.list(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }
            
            // html
            token = this._tokenizer.html(text, cursor);
            if (token) {
                tokenStore.push(token);
                cursor += token.textLength;
                continue;
            }

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

    private __pushInlineQueue(startIndex: number, textLength: number, tokenStore: Token[]): void {
        this._inlineTokensQueue.push([startIndex, textLength, tokenStore]);
    }

    /**
     * @description If provided any external tokenizers, we try to analysis them
     * with the given text. Returns a {@link Markdown.TokenResult} if a token is
     * matched.
     */
    private __tryExternalTokenizers(text: string, cursor: number): Token | null {
        if (!this._opts.extensionTokenizers) {
            return null;
        }
        
        const tokenizers = this._opts.extensionTokenizers;
        let token: Token | null = null;
        
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