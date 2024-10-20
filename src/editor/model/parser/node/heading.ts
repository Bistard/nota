import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class A heading textblock, with a `level` attribute that should hold the 
 * number 1 to 6. Parsed and serialized as `<h1>` to `<h6>` elements.
 */
export class Heading extends DocumentNode<EditorTokens.Heading> {

    constructor() {
        super(TokenEnum.Heading);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: '(text | image)*',
            defining: true,
            attrs: { 
                level: { default: 1 } 
            },
            parseDOM: [
                { tag: 'h1', attrs: { level: 1 } },
                { tag: 'h2', attrs: { level: 2 } },
                { tag: 'h3', attrs: { level: 3 } },
                { tag: 'h4', attrs: { level: 4 } },
                { tag: 'h5', attrs: { level: 5 } },
                { tag: 'h6', attrs: { level: 6 } },
            ],
            toDOM(node) { 
                const level = node.attrs['level'];
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: `h${level}`,
                    editable: true,
                });
            },
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Heading): void {
        state.activateNode(this.ctor, {
            level: token.depth,
        });

        if (token.tokens) {
            state.parseTokens(token.tokens);
        }
        
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { level } = node.attrs;
        // state.write('#'.repeat(level) + ' ');
        state.write('#'.repeat(level - 1) + ' ');
        state.serializeInline(node, false);
        state.closeBlock(node);
    };
}