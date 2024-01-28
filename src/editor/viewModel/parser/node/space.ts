import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

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
            toDOM: () => { 
                return ['p', 0];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Space): void {
        state.activateNode(this.ctor);

        /**
         * Calculates the whitespace string to be inserted into the document 
         * for a space token.
         * 
         * This calculation involves two key adjustments:
         * 1. Subtract 1 to offset the `repeat` method's addition of an extra 
         *      character.
         * 2. Subtract another 1 to account for the parser treating `\n\n` as a 
         *      single space, ensuring the `spaces` string reflects the intended 
         *      whitespace accurately.
         */
        const spaces = '\n'.repeat(token.raw.length - 2);
        state.addText(spaces);

        state.deactivateNode();
    }
}