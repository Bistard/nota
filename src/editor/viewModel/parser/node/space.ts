import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, createDomOutputFromOptions } from "src/editor/viewModel/parser/documentNode";
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
                    type: 'nested',
                    tagName: 'p',
                    children: [0],
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Space): void {
        
        /**
         * Iterate every new line, create a {@link Space} for it. Every space
         * will be rendered as an empty paragraph.
         */
        for (let i = 0; i < token.raw.length; i++) {
            state.activateNode(this.ctor);
            state.deactivateNode();
        }
    }
}