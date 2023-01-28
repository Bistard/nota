import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

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

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Text): void {
        if (!token.tokens) {
            state.addText(token.text);
            return;
        }

        
        /**
         * The following special handling cases can be linked by this issue
         * {@link https://github.com/markedjs/marked/issues/2684}.
         */

        /**
         * If a `text` token has a list of children, it will be treated as a
         * `paragraph` for easy handling.
         */
        (<string>token.type) = TokenEnum.Paragraph;
        state.parseTokens([token]);
    }
}