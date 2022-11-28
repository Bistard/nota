import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A blockquote (`<blockquote>`) wrapping one or more blocks.
 */
export class Blockquote extends DocumentNode<EditorTokens.Blockquote> {

    constructor() {
        super(TokenEnum.Blockquote);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'block+',
            defining: true,
            parseDOM: [{ tag: 'blockquote' }],
            toDOM: () => { return ['blockquote', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Blockquote): void {
        state.activateNode(this.ctor);
        if (token.tokens) {
            state.parseTokens(token.tokens);
        }
        state.deactivateNode();
    }
}