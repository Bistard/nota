import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/parser/documentNode";
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
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        }
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.serializeInline(node);
        state.closeBlock(node);
    };
}