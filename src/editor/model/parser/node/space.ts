import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken, EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/parser/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

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
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: 'p',
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Space>): void {
        const { token, next, prev } = status;
        
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
         * paragraph, the paragraph content must contain `n-2` line breaks.
         * 
         * Based on 1 and 2, eventually we need to delete 2 line breaks to 
         * correctly visualize the spaces.
         * 
         * If the very first token has type 'space', then only 1 line break
         * is deleted.
         */
        let spaces = token.raw;

        // remove the first `\n` (this one presents the new line from the previous block)
        if (prev && spaces.at(0) === '\n') {
            spaces = spaces.slice(1, undefined); 
        }
        // remove the last `\n` (this one presents the new line from the next block)
        if (next && spaces.at(-1) === '\n') {
            spaces = spaces.slice(0, -1); 
        }

        state.activateNode(this.ctor, status, {});
        state.parseTokens(status.level + 1, [{ type: 'text', raw: spaces, text: spaces }], token);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const text = node.textContent;
        state.text(text);
        state.closeBlock(node);
    };
}