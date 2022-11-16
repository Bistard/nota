import { marked } from "src/editor/model/markdown/marked/marked";

/**
 * An interface only for {@link MarkdownLexer}.
 */
export interface IMarkdownLexer {

    /**
     * @description Apply a lexical analysis on the given text and returns the 
     * analyzed tokens.
     * @param text The given text.
     * @param offset The offset relatives to the whole text model. Default is 0.
     * 
     * @note Each token index is relatives to the whole text model (absolute).
     */
    lex(text: string, offset?: number): marked.Token[];
}

export class MarkdownLexer implements IMarkdownLexer {

    constructor() {}

    // [public methods]

    public lex(text: string, offset?: number): marked.Token[] {
        const tokens = marked.lexer(text);
        return tokens;
    }
}