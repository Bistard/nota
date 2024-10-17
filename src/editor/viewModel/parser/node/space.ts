import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { createDomOutputFromOptions } from "../../schema";
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
            parseDOM: [{ tag: 'p' }],
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: 'p',
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Space): void {
        
        /**
         * The rendering logic for a space is as follows: Always render an empty 
         * paragraph with a number of line breaks (\n) the same as spaces.
         *
         * 1. According to the parsing logic of "marked", if there is a line 
         * break between two paragraphs in the file, the resulting space token 
         * will actually contain two end-of-line characters (\n). This is 
         * because it ALSO includes the end of line from the previous paragraph. 
         * 
         * 2. Therefore, to visually represent `n` line breaks within the empty 
         * paragraph, the paragraph content must contain `n-1` line breaks.
         * 
         * Based on 1 and 2, eventually we need to delete 2 line breaks to 
         * correctly visualize the spaces.
         * 
         * If the very first token has type 'space', then only 1 line break
         * is deleted.
         */
        let spaces = token.raw;
        if (state.isAnyActiveToken()) {
            spaces = spaces.slice(2, undefined) ?? '';
        }
        
        state.activateNode(this.ctor);
        state.parseTokens([{ type: 'text', raw: spaces, text: spaces }]);
        state.deactivateNode();
    }
}