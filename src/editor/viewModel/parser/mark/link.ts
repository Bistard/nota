import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class A link. Has `href` and `title` attributes. `title` defaults to the 
 * empty string. Rendered as an `<a>` element.
 */
export class Link extends DocumentMark<EditorTokens.Link> {

    constructor() {
        super(MarkEnum.Link);
    }

    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                href: {},
                title: { default: null }
            },
            inclusive: false,
            parseDOM: [
            {
                tag: 'a[href]', 
                getAttrs: (dom: HTMLElement) => {
                    return {
                        href: dom.getAttribute('href'),
                        title: dom.getAttribute('title'),
                    };
                }
            }],
            toDOM: (node) => {
                const { href, title } = node.attrs;
                return ['a', { href, title }, 0];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Link): void {
        state.activateMark(this.ctor.create({
            href: token.href,
            title: token.title,
        }));
        state.addText(token.text);
        state.deactivateMark(this.ctor);
    }
}