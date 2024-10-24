import { CodeEditorView, minimalSetup } from "src/editor/common/codeMirrror";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

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
                lang: {
                    default: ''
                },
            },
            toDOM: (node) => { 
                const { view } = node.attrs;
                return view.dom;
            },
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.CodeBlock): void {
        
        const view = new CodeEditorView({
            doc: token.text,
            extensions: [minimalSetup],
        });
        
        state.activateNode(this.ctor, { view: view, lang: token.lang });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { lang } = node.attrs;
        
        // Make sure the front matter fences are longer than any dash sequence within it
        const backticks = node.textContent.match(/`{3,}/gm);
        const fence = backticks ? (backticks.sort().slice(-1)[0] + '`') : '```';

        state.write(fence + (lang || '') + '\n');
        state.text(node.textContent, false);
        
        // Add a newline to the current content before adding closing marker
        state.write('\n');
        state.write(fence);
        state.closeBlock(node);
    };
}