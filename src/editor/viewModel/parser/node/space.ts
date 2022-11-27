import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/documentParser";

/**
 * @class An empty space block. Represented in the DOM as an empty `<p>` 
 * element.
 */
export class Space extends DocumentNode<EditorTokens.Space> {

    constructor() {
        super(TokenEnum.Space);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'inline*',
            parseDOM: [{ tag: 'div' }],
            toDOM: () => {
                const dom = document.createElement('div');
                dom.innerHTML = '&nbsp;';
                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Space): void {
        state.activateNode(this.ctor);
        state.deactivateNode();
    }
}