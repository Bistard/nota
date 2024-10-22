import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class A plain paragraph textblock. Represented in the DOM as a `<p>` 
 * element.
 */
export class Paragraph extends DocumentNode<EditorTokens.Paragraph> {

    constructor() {
        super(TokenEnum.Paragraph);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'inline*',
            parseDOM: [{ tag: 'p' }],
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: 'p',
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Paragraph): void {
        state.activateNode(this.ctor);
        if (token.tokens) {
            state.parseTokens(token.tokens);
        }

        /**
         * @see https://github.com/markedjs/marked/issues/3501
         * In the `marked` library, the only case where a single '\n' appears at 
         * the end of the raw text in a paragraph token is when this paragraph is 
         * the last one in the entire document.
         * 
         * Since the presence of this special newline is only detectable within 
         * the context of the paragraph token, we need to manually append a `\n` 
         * after rendering the inner text.
         */
        if (token.raw.at(-1) === '\n') {
            state.addText('\n');
        }

        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.serializeInline(node);
        state.closeBlock(node);
    };
}