import { Disposable } from "src/base/common/dispose";
import { marked } from "src/editor/model/markdown/marked/marked";

/**
 * @class // TODO
 */
export class EditorModelTokenization extends Disposable {

    constructor() {
        super();
    }

    public tokenization(text: string): void {
        const tokens = marked.lexer(text);
        console.log(tokens);
    }

}

export class MarkdownTokenizer {
    
}