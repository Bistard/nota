import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/documentParser";

export class Heading extends DocumentNode<EditorTokens.Heading> {

    constructor() {
        super(TokenEnum.Heading);
    }

    public getSchema(): ProseNodeSpec {
        return {
            content: 'inline*',
            group: 'block',
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
        state.activateNode(this.ctor);
        if (token.tokens) {
            state.parseTokens(token.tokens);
        }
        state.deactivateNode();
    }
}