import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A hard line break, represented in the DOM as `<br>`.
 */
export class LineBreak extends DocumentNode<EditorTokens.Br> {

    constructor() {
        super(TokenEnum.LineBreak);
    }

    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'inline',
            inline: true,
            selectable: false,
            parseDOM: [{ tag: 'br' }],
            toDOM: () => { return ['br']; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Br): void {
        state.activateNode(this.ctor);
        state.deactivateNode();
    }
}