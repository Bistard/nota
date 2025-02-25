import { memoize } from "src/base/common/memoization";
import { isString } from "src/base/common/utilities/type";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

export type ListAttrs = {
    /**
     * @default false
     */
    readonly ordered?: boolean;

    /**
     * @default false
     */
    readonly tight?: boolean;

    /**
     * If {@link ordered=true}, this indicates the starting number of an ordered
     * list.
     * @default 1
     */
    readonly start?: number;
};

/**
 * @class A block node that represents ordered list or unordered list. Parsing 
 * as '<ul>' or '<ol>' in DOM tree.
 */
export class List extends DocumentNode<EditorTokens.List> {

    constructor() {
        super(TokenEnum.List);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'list_item+',
            attrs: <GetProseAttrs<ListAttrs>>{ 
                ordered: { default: false },
                tight: { default: false },
                start: { default: 1, },
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
                start: isString(token.start) ? 1 : token.start,
            }
        });
        state.parseTokens(status.level + 1, token.items, token);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode) => {
        const isOrdered = node.attrs['ordered'] as boolean;
        const tight = node.attrs['tight'] as boolean;
        const start = node.attrs['start'] as number;

        // un-ordered
        if (isOrdered === false) {
            state.serializeList(node, '  ', () => ('* '));
        }
        // ordered
        else {
            const maxW = String(Number(start) + node.childCount - 1).length;
            const space = ' '.repeat(maxW + 2);
            state.serializeList(node, space, index => {
                const nStr = String(start + index);
                return ' '.repeat(maxW - nStr.length) + nStr + '. ';
            });
        }
    };
}

export class ListItem extends DocumentNode<EditorTokens.ListItem> {

    constructor() {
        super(TokenEnum.ListItem);
    }

    @memoize
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

    public serializer = (state: IMarkdownSerializerState, node: ProseNode) => {
        state.serializeBlock(node);
    };
}