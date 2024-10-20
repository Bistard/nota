import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { createDomOutputFromOptions } from "src/editor/model/schema";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class The plain-text node.
 */
export class Escape extends DocumentNode<EditorTokens.Escape> {

    constructor() {
        super(TokenEnum.Escape);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'inline',
            inline: true,
            content: undefined,
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Escape): void {
        state.addText(token.raw);
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.text(node.text!, false);
    };
}