import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/parser";

/**
 * @class An inline image (`<img>`) node. Supports `src`, `alt`, and `href` 
 * attributes. The latter two default to the empty string.
 */
export class Image extends DocumentNode<EditorTokens.Image> {

    constructor() {
        super(TokenEnum.Image);
    }

    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'inline',
            inline: true,
            attrs: {
                src: {},
                alt: { default: null },
                title: { default: null }
            },
            draggable: true,
            parseDOM: [
                {
                    tag: 'img[src]', 
                    getAttrs: (dom: HTMLElement) => {
                        return {
                            src: dom.getAttribute('src'),
                            title: dom.getAttribute('title'),
                            alt: dom.getAttribute('alt')
                        };
                    }
                }
            ],
            toDOM: (node) => {
                const { src, alt, title } = node.attrs;
                return ['img', { src, alt, title }];
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Image): void {
        state.activateNode(this.ctor, {
            src: token.href,
            title: token.title,
        });
        state.deactivateNode();
    }
}