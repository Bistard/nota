import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { memoize } from "src/base/common/memoization";

export type ParagraphAttrs = {
    // noop for now
};

/**
 * @class A plain paragraph textblock. Represented in the DOM as a `<p>` 
 * element.
 */
export class Paragraph extends DocumentNode<EditorTokens.Paragraph> {

    constructor() {
        super(TokenEnum.Paragraph);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'inline*',
            attrs: {} satisfies GetProseAttrs<ParagraphAttrs>,
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: 'p',
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Paragraph>): void {
        const token = status.token;
        state.activateNode(this.ctor, status);
        if (token.tokens.length > 0) {
            state.parseTokens(status.level + 1, token.tokens, token);
        }
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        if (node.childCount > 0) {
            state.serializeInline(node);
        } 
        // If empty paragraph, simulate as a `space`.
        else {
            state.write('\n');
        }
        state.closeBlock(node);
    };
}