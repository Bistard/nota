import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/documentParser";

export class Text extends DocumentNode<EditorTokens.Text> {

    constructor() {
        super(TokenEnum.Text);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'inline',
            content: undefined,
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Text): void {
        state.addText(token.text);
    }
}