import { IMarkdownLexer } from "src/editor/common/markdown";
import { marked } from "src/editor/model/markdown/marked/marked";

export class MarkdownLexer implements IMarkdownLexer {

    constructor() {

    }

    // [public methods]

    public lex(text: string, offset?: number): marked.Token[] {
        const tokens = marked.lexer(text);
        return tokens;
    }

}