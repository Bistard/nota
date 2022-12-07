import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A block node that represents `<html>`.
 */
export class HTML extends DocumentNode<EditorTokens.HTML> {

    constructor() {
        super(TokenEnum.HTML);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            attrs: {
                text: {},
            },
            parseDOM: [
                { 
                    tag: 'html',
                }
            ],
            toDOM: (node) => { 
                const { text } = node.attrs;

                const dom = document.createElement('div');
                dom.innerHTML = text;

                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.HTML): void {
        state.activateNode(this.ctor, {
            text: token.text,
        });
        state.deactivateNode();
    }
}