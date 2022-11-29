import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A code listing. Disallows marks or non-text inline nodes by default. 
 * Represented as a `<pre>` element with a `<code>` element inside of it.
 */
export class CodeBlock extends DocumentNode<EditorTokens.CodeBlock> {

    constructor() {
        super(TokenEnum.CodeBlock);
    }

    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'block',
            content: 'text*',
            marks: '',
            code: true,
            defining: true,
            parseDOM: [
                { tag: 'pre', preserveWhitespace: 'full' },
            ],
            toDOM: () => { 
                return ['pre', ['code', 0]]; 
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.CodeBlock): void {
        state.activateNode(this.ctor);
        state.addText(token.text);
        state.deactivateNode();
    }
}