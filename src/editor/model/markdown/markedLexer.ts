import { marked } from "src/editor/model/markdown/marked/marked";

export class MarkdownLexer {

    constructor() {

    }

    // [public methods]

    public lex(text: string): any {
        const tokens = marked.lexer(text);
        return tokens;
    }

}