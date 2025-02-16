import { memoize } from "src/base/common/memoization";
import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec, ProseNode } from "src/editor/common/proseMirror";
import { DocumentMark, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IDocumentMarkSerializationOptions } from "src/editor/model/serializer";

/**
 * @class A link. Has `href` and `title` attributes. `title` defaults to the 
 * empty string. Rendered as an `<a>` element.
 */
export class Link extends DocumentMark<EditorTokens.Link> {

    constructor() {
        super(MarkEnum.Link);
    }

    @memoize
    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                href: {},
                title: { default: null }
            },
            inclusive: false,
            toDOM: (node) => {
                const { href, title } = node.attrs;
                return ['a', { href, title }, 0];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Link>): void {
        const { token } = status;
        state.activateMark(this.ctor.create({
            href: token.href,
            title: token.title,
        }));
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        } else {
            state.addText(token.text);
        }
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (state, mark, parent, index) => {
            state.setInAutoLink(__isPlainURL(mark, parent, index));
            return state.inAutoLink ? "<" : "[";
        },
        serializeClose: (state, mark, parent, index) => {
            const { title, href } = mark.attrs;
            const inAutoLink = state.inAutoLink;

            state.setInAutoLink(undefined);
            return inAutoLink 
                ? ">" 
                : "](" + href.replace(/[()"]/g, "\\$&") + (title ? ` "${title.replace(/"/g, '\\"')}"` : "") + ")";
        },
        mixable: true,
        expelEnclosingWhitespace: true,
    };
}

function __isPlainURL(link: ProseMark, parent: ProseNode, index: number): boolean {
    const { title, href } = link.attrs;
    
    // Check if the link has a title or the href does not match a URL pattern
    if (title || !/^\w+:/.test(href)) {
        return false;
    }
    const currentNode = parent.child(index);

    // Ensure the current node is text and matches the link's href, and the link is the last mark
    if (!currentNode.isText || currentNode.text !== href || currentNode.marks[currentNode.marks.length - 1] !== link) {
        return false;
    }

    // Check if this is the last node or if the next node does not share the same marks
    return index === parent.childCount - 1 || !link.isInSet(parent.child(index + 1).marks);
}