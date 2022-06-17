import { IMarkdownLexer, IMarkdownTokenizer, Markdown } from "src/editor/common/markdown";
import { MD_BLOCK_RULE } from "src/editor/model/markdown/rule";

export class MarkdownTokenizer implements IMarkdownTokenizer {

    // [field]

    private readonly _lexer: IMarkdownLexer;

    // [constructor]

    constructor(lexer: IMarkdownLexer) {
        this._lexer = lexer;
    }

    // [public methods]

    public text(text: string, cursor: number): Markdown.Text | null {
        MD_BLOCK_RULE.text.lastIndex = cursor;
        const match = MD_BLOCK_RULE.text.exec(text);

        if (match) {
            const token: Markdown.Text = {
                type: Markdown.TokenType.TEXT,
                startIndex: match.index,
                textLength: match[0]!.length,
                tokens: []
            };
            this._lexer.pushInlineQueue(token.startIndex, token.textLength, token.tokens);
            return token;
        }

        return null;
    }

    public space(text: string, cursor: number): Markdown.Space | null {
        MD_BLOCK_RULE.space.lastIndex = cursor;
        const match = MD_BLOCK_RULE.space.exec(text);
        
        if (match) {
            
            return {
                type: Markdown.TokenType.SPACE,
                startIndex: match.index,
                textLength: match[0]!.length
            };
        }

        return null;
    }

}