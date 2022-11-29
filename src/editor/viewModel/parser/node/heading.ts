import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A heading textblock, with a `level` attribute that should hold the 
 * number 1 to 6. Parsed and serialized as `<h1>` to `<h6>` elements.
 */
export class Heading extends DocumentNode<EditorTokens.Heading> {

    constructor() {
        super(TokenEnum.Heading);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'inline*',
            defining: true,
            attrs: { 
                level: { default: 1 } 
            },
            parseDOM: [
                { tag: 'h1', attrs: { level: 1 } },
                { tag: 'h2', attrs: { level: 2 } },
                { tag: 'h3', attrs: { level: 3 } },
                { tag: 'h4', attrs: { level: 4 } },
                { tag: 'h5', attrs: { level: 5 } },
                { tag: 'h6', attrs: { level: 6 } },
            ],
            toDOM(node) { return ['h' + node.attrs['level'], 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Heading): void {
        state.activateNode(this.ctor, {
            level: token.depth,
        });

        if (token.tokens) {
            state.parseTokens(token.tokens);
        }
        
        state.deactivateNode();
    }
}