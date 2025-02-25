import 'src/editor/model/documentNode/node/codeBlock/codeBlock.scss';
import { memoize } from "src/base/common/memoization";
import { CodeEditorView, minimalSetup } from "src/editor/common/codeMirror";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";

export type CodeBlockAttrs = {
    /** @default '' */
    readonly lang?: string;
    readonly view?: CodeEditorView;
};

// region - CodeBlock

/**
 * @class A code listing. Disallows marks or non-text inline nodes by default. 
 * Represented as a `<pre>` element with a `<code>` element inside of it.
 */
export class CodeBlock extends DocumentNode<EditorTokens.CodeBlock> {

    constructor(
        @IClipboardService private readonly clipboardService: IClipboardService,
    ) {
        super(TokenEnum.CodeBlock);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'block',
            marks: '', // disallow any marks
            code: true,
            defining: true,
            content: 'text*',
            attrs: <GetProseAttrs<CodeBlockAttrs>>{
                view: { default: CodeBlock.createView('') },
                lang: { default: '' },
            },
            toDOM: (node) => { 
                const { view, lang } = node.attrs;
                
                // the entire container of a code block
                const container = document.createElement('div');
                container.classList.add('code-block-container');

                const header = this.__createCodeBlockHeader(lang, view);
                container.appendChild(header);
                container.appendChild(view.dom);

                return container;
            },
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.CodeBlock>): void {
        const { token } = status;
        const attrs = {
            view: CodeBlock.createView(token.text),
            lang: token.lang,
            text: token.text,
        };
        state.activateNode(this.ctor, status, { attrs: attrs });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const lang = node.attrs['lang'] as string;
        const view = node.attrs['view'] as CodeEditorView;
        
        const textContent = view.state.doc.toString();

        const fence = '`'.repeat(3);
        state.write(fence + lang);

        if (textContent.length > 0) {
            state.text('\n');
            state.text(textContent, false);
        }

        state.write('\n');
        state.write(fence);

        state.closeBlock(node);
    };

    public static createView(text: string): CodeEditorView {
        return new CodeEditorView({ 
            doc: text ?? '', 
            extensions: [minimalSetup],
        });
    }

    // region - [private]

    private __createCodeBlockHeader(lang: string, editorView: CodeEditorView): HTMLElement {
        const header = document.createElement('div');
        header.classList.add('code-block-header');
    
        const langLabel = document.createElement('span');
        langLabel.classList.add('code-lang');
        langLabel.textContent = lang;
    
        const copyButton = document.createElement('button');
        copyButton.classList.add('code-copy');
        copyButton.textContent = '📋';
    
        copyButton.onclick = async () => {
            await this.clipboardService.write(ClipboardType.Text, editorView.state.doc.toString());
            copyButton.textContent = '✔️';
            setTimeout(() => (copyButton.textContent = '📋'), 2000);
        };
    
        header.appendChild(langLabel);
        header.appendChild(copyButton);
        return header;
    }
}
