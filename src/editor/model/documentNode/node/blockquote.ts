import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { memoize } from "src/base/common/memoization";
import { createDomOutputFromOptions } from "src/editor/model/schema";

export type BlockquoteAttrs = {
    // noop for now
};

/**
 * @class A blockquote (`<blockquote>`) wrapping one or more blocks.
 */
export class Blockquote extends DocumentNode<EditorTokens.Blockquote> {

    constructor() {
        super(TokenEnum.Blockquote);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'block+',
            defining: true,
            attrs: {
            } satisfies GetProseAttrs<BlockquoteAttrs>,
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: `blockquote`,
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Blockquote>): void {
        const { token } = status;

        state.activateNode(this.ctor, status, {
            attrs: {}
        });
        
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        }
        
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode) => {
        state.wrapBlock(node, () => state.serializeBlock(node), "> ");
    };
}