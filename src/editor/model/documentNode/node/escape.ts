import { memoize } from "src/base/common/memoization";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

/**
 * @class The plain-text node.
 */
export class Escape extends DocumentNode<EditorTokens.Escape> {

    constructor() {
        super(TokenEnum.Escape);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'inline',
            inline: true,
            content: undefined,
        };
    }

    public parseFromToken(state: IDocumentParseState, { token }: IParseTokenStatus<EditorTokens.Escape>): void {
        state.addText(token.raw);
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.text(node.text!, false);
    };
}