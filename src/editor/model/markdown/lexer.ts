import { Token } from "prismjs";
import { IMarkdownLexer, IMarkdownLexerOptions, Markdown, MarkdownLexerDefaultOptions } from "src/editor/common/markdown";
import { marked } from "src/editor/model/markdown/marked/marked";


export class MarkdownLexer implements IMarkdownLexer {

    // [field]

    private _opts: IMarkdownLexerOptions;

    private readonly _blockTokens: Token[];
    private readonly _inlineTokens: Token[];

    // [constructor]

    constructor(opts?: IMarkdownLexerOptions) {
        this._opts = opts || MarkdownLexerDefaultOptions;
        this._blockTokens = [];
        this._inlineTokens = [];
    }

    // [public method]

    public analysis(text: string): Markdown.Token[] {
        
        // REVIEW: testonly
        const tokens = marked.lexer(text);
        console.log(tokens);
        
        return [];
    }

}