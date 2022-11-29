import { CodeEditorView, minimalSetup } from "src/editor/common/codeMirrror";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
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
            attrs: {
                view: {},
            },
            parseDOM: [
                { tag: 'pre', preserveWhitespace: 'full' },
            ],
            toDOM: (node) => { 
                const { view } = node.attrs;
                return view.dom;
            },
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.CodeBlock): void {
        
        const view = new CodeEditorView({
            doc: token.text,
            extensions: [minimalSetup]
        });
        
        state.activateNode(this.ctor, { view: view });
        state.deactivateNode();
    }

    // [private helper methods]
}