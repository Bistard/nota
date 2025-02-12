import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken, EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

/**
 * @class The plain-text node.
 */
export class Text extends DocumentNode<EditorTokens.Text> {

    constructor() {
        super(TokenEnum.Text);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'inline',
            inline: true,
            content: undefined,
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Text>): void {
        const { token, parent } = status;
        if (!token.tokens) {
            state.addText(token.text);
            return;
        }

        /**
         * If a `text` token has a list of children, it will be treated as a
         * `paragraph` for easy handling.
         * 
         * The following special handling cases can be linked by this issue
         * {@link https://github.com/markedjs/marked/issues/2684}.
         */
        (<string>token.type) = TokenEnum.Paragraph;
        state.parseTokens(status.level + 1, [token], parent!);
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.text(node.text!, false);
    };
}