import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { memoize } from "src/base/common/memoization";
import { resolveImagePath } from "src/editor/common/editor";
import { IWorkspaceService } from "src/workbench/parts/workspace/workspaceService";

export type ImageAttrs = {
    readonly src?: string;
    readonly alt?: string;
    readonly title?: string;
};

/**
 * @class An inline image (`<img>`) node. Supports `src`, `alt`, and `href` 
 * attributes. The latter two default to the empty string.
 */
export class Image extends DocumentNode<EditorTokens.Image> {

    constructor(
        @IWorkspaceService private readonly workspaceService: IWorkspaceService,
    ) {
        super(TokenEnum.Image);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'inline',
            inline: true,
            content: undefined,
            attrs: {
                src: { default: '' },
                alt: { default: '' },
                title: { default: '' }
            } satisfies GetProseAttrs<ImageAttrs>,
            draggable: true,
            toDOM: (node) => {
                const { src, alt, title } = node.attrs;
                const resolvedSrc = resolveImagePath(this.workspaceService, src);

                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: 'img',
                    attributes: { 
                        src: resolvedSrc, 
                        alt, 
                        title,
                    },
                    editable: false,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Image>): void {
        const token = status.token;
        state.activateNode(this.ctor, status, {
            attrs: {
                src: token.href,
                title: token.title,
                alt: token.text,
            }
        });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { alt, title, src } = node.attrs;

        // Escape special characters in alt text and source URL
        const escapedAlt = state.escaping(alt || '');
        const escapedSrc = src.replace(/[()]/g, '\\$&');

        // Handle the title, if it exists
        const formattedTitle = title ? ` "${title.replace(/"/g, '\\"')}"` : '';

        // Write the final markdown string
        state.write(`![${escapedAlt}](${escapedSrc}${formattedTitle})`);

    };
}