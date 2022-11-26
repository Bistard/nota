import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/documentParser";

export class Space extends DocumentNode<EditorTokens.Space> {

    constructor() {
        super(TokenEnum.Space);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            parseDOM: [{ tag: 'p' }],
            toDOM: () => { return ['p', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Space): void {
        state.activateNode(this.ctor);
        state.deactivateNode();
    }
}