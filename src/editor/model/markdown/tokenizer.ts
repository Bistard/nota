import { IMarkdownTokenizer, Markdown } from "src/editor/common/markdown";
import { MD_BLOCK_RULE } from "src/editor/model/markdown/rule";

type Token = Markdown.Token;

export class MarkdownTokenizer implements IMarkdownTokenizer {

    // [field]

    // [constructor]

    constructor(
        private readonly __pushInlineQueue: (startIndex: number, textLength: number, tokenStore: Token[]) => void,
        private readonly __lexBlock: (text: string, tokenStore: Token[]) => Token[],
    ) {}

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
            this.__pushInlineQueue(token.startIndex, token.textLength, token.tokens);
            return token;
        }

        return null;
    }

    public space(text: string, cursor: number): Markdown.Space | null {
        MD_BLOCK_RULE.space.lastIndex = cursor;

        const match = MD_BLOCK_RULE.space.exec(text);
        if (match && match[0]!.length > 0) {
            return {
                type: Markdown.TokenType.SPACE,
                startIndex: match.index,
                textLength: match[0]!.length
            };
        }

        return null;
    }

    public indentCode(text: string, cursor: number): Markdown.Code | null {
        MD_BLOCK_RULE.indentCode.lastIndex = cursor;
        
        const match = MD_BLOCK_RULE.indentCode.exec(text);
        if (match) {
            return {
                type: Markdown.TokenType.CODE,
                startIndex: match.index,
                textLength: match[0]!.length,
                lang: ''
            };
        }

        return null;
    }

    public fenchCode(text: string, cursor: number): Markdown.Code | null {
        MD_BLOCK_RULE.fenceCode.lastIndex = cursor;
        
        const match = MD_BLOCK_RULE.fenceCode.exec(text);
        if (match) {
            return {
                type: Markdown.TokenType.CODE,
                startIndex: match.index,
                textLength: match[0]!.length,
                lang: match[2] ? match[2]!.trim() : ''
            };
        }

        return null;
    }

    public heading(text: string, cursor: number): Markdown.Heading | null {
        MD_BLOCK_RULE.heading.lastIndex = cursor;
        
        const match = MD_BLOCK_RULE.heading.exec(text);
        if (match) {
            const token: Markdown.Heading = {
                type: Markdown.TokenType.HEADING,
                depth: match[1]!.length,
                startIndex: match.index,
                textLength: match[0]!.length,
                tokens: []
            };
            this.__pushInlineQueue(token.startIndex, token.textLength, token.tokens);
            return token;
        }

        return null;
    }

    public hr(text: string, cursor: number): Markdown.Hr | null {
        MD_BLOCK_RULE.hr.lastIndex = cursor;
        
        const match = MD_BLOCK_RULE.hr.exec(text);
        if (match) {
            return {
                type: Markdown.TokenType.HR,
                startIndex: match.index,
                textLength: match[0]!.length
            }
        }

        return null;
    }

    public blockQuote(text: string, cursor: number): Markdown.BlockQuote | null {
        MD_BLOCK_RULE.blockQuote.lastIndex = cursor;

        const match = MD_BLOCK_RULE.blockQuote.exec(text);
        if (match) {
            const nestText = match[0]!.replace(/^ *>[ \t]?/gm, '');
            return {
                type: Markdown.TokenType.BLOCK_QUOTE,
                startIndex: match.index,
                textLength: match[0]!.length,
                tokens: this.__lexBlock(nestText, []) // FIX: 这里的startIndex都是relative了
            };
        }

        return null;
    }

    public list(text: string, cursor: number): Markdown.List | null {
        // TODO
        return null;
    }

    public html(text: string, cursor: number): Markdown.HTML | null {
        MD_BLOCK_RULE.html.lastIndex = cursor;

        const match = MD_BLOCK_RULE.html.exec(text);
        if (match) {
            const tag = match[1]!;
            return {
                type: Markdown.TokenType.HTML,
                pre: (tag === 'pre' || tag === 'script' || tag === 'style'),
                startIndex: match.index,
                textLength: match[0]!.length
            };
        }

        return null;
    }

    public paragraph(text: string, cursor: number): Markdown.Paragraph | null {
        MD_BLOCK_RULE.paragraph.lastIndex = cursor;

        const match = MD_BLOCK_RULE.paragraph.exec(text);
        if (match) {
            const token: Markdown.Paragraph = {
                type: Markdown.TokenType.PARAGRAPH,
                startIndex: match.index,
                textLength: match[0]!.length,
                tokens: []
            };
            this.__pushInlineQueue(token.startIndex, token.textLength, token.tokens);
            return token;
        }

        return null;
    }

}