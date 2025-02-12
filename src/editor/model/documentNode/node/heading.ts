import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { memoize } from "src/base/common/memoization";

/**
 * @class A heading textblock, with a `level` attribute that should hold the 
 * number 1 to 6. Parsed and serialized as `<h1>` to `<h6>` elements.
 */
export class Heading extends DocumentNode<EditorTokens.Heading> {

    constructor() {
        super(TokenEnum.Heading);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'inline*',
            defining: true,
            attrs: { 
                level: { default: 1 } 
            },
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

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Heading>): void {
        const token = status.token;
        state.activateNode(this.ctor, status, {
            attrs: { level: token.depth, }
        });

        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        }
        
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { level } = node.attrs;
        state.write('#'.repeat(level) + ' ');
        state.serializeInline(node, false);
        state.closeBlock(node);
    };
}