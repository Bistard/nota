import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A block node that represents ordered list or unordered list. Parsing 
 * as '<ul>' or '<ol>' in DOM tree.
 */
export class List extends DocumentNode<EditorTokens.List> {

    constructor() {
        super(TokenEnum.List);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'list_item+',
            attrs: { 
                ordered: { default: false },
                tight: { default: false },
            },
            parseDOM: [
                {
                    tag: 'ul', 
                    getAttrs: dom => ({ 
                        ordred: false,
                        tight: (<HTMLElement>dom).hasAttribute('data-tight'),
                    }),
                },
                {
                    tag: 'ol', 
                    getAttrs: dom => ({ 
                        ordred: true,
                        tight: (<HTMLElement>dom).hasAttribute('data-tight'),
                    }),
                }
            ],
            toDOM(node) { 
                const { ordered, tight } = node.attrs;
                const tag = ordered ? 'ol' : 'ul';
                return [tag, { 'data-tight': tight ? 'true' : null }, 0];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.List): void {
        state.activateNode(this.ctor, {
            ordered: token.ordered,
            tight: !token.loose,
        });
        state.parseTokens(token.items);
        state.deactivateNode();
    }
}

export class ListItem extends DocumentNode<EditorTokens.ListItem> {

    constructor() {
        super(TokenEnum.ListItem);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'list_item',
            content: 'block*',
            defining: true,
            attrs: {
                task: { default: false },
                checked: { default: false },
            },
            parseDOM: [
                { tag: 'li' },
            ],
            toDOM(node) { 
                // TODO: parsing by attributes
                return ['li', 0]; 
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.ListItem): void {
        state.activateNode(this.ctor, {
            task: token.task,
            checked: token.checked,
        });
        state.parseTokens(token.tokens);
        state.deactivateNode();
    }
}