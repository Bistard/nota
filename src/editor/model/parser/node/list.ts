import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

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
            toDOM(node) { 
                const { ordered, tight } = node.attrs;
                const tag = ordered ? 'ol' : 'ul';
                return [tag, { 'data-tight': tight ? 'true' : null }, 0];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.List>): void {
        const { token } = status;
        state.activateNode(this.ctor, status, {
            attrs: {
                ordered: token.ordered,
                tight: !token.loose,
            }
        });
        state.parseTokens(status.level + 1, token.items, token);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        // TODO
    };
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
            toDOM(node) { 
                // TODO: parsing by attributes
                return ['li', 0]; 
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.ListItem>): void {
        const { token } = status;
        state.activateNode(this.ctor, status, {
            attrs: {
                task: token.task,
                checked: token.checked,
            }
        });
        state.parseTokens(status.level + 1, token.tokens, token);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        // TODO
    };
}