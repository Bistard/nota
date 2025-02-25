import { TokenEnum, MarkEnum } from "src/editor/common/markdown";
import { IEditorSnippetExtension } from "src/editor/contrib/snippet/snippet";
import { CodeBlockAttrs } from "src/editor/model/documentNode/node/codeBlock/codeBlock";
import { HeadingAttrs } from "src/editor/model/documentNode/node/heading";

export function registerDefaultSnippet(extension: IEditorSnippetExtension): void {

    extension.registerRule("emDashRule", /--$/, "—");
    extension.registerRule("ellipsisRule", /\.\.\.$/, "…");
    extension.registerRule("openDoubleQuoteRule", /(?:^|[\s{[(<'"\u2018\u201C])(")$/, "“");
    extension.registerRule("closeDoubleQuoteRule", /"$/, "”");
    extension.registerRule("openSingleQuoteRule", /(?:^|[\s{[(<'"\u2018\u201C])(')$/, "‘");
    extension.registerRule("closeSingleQuoteRule", /'$/, "’");

    // Heading Rule: Matches "#" followed by a space
    extension.registerRule("headingRule", /^(#{1,6})\s$/,
        {
            type: 'node',
            nodeType: TokenEnum.Heading,
            whenReplace: 'type',
            getAttribute: (match): HeadingAttrs => {
                return {
                    level: match[1]?.length,
                };
            },
            wrapStrategy: 'WrapTextBlock'
        }
    );

    // Blockquote Rule: Matches ">" followed by a space
    extension.registerRule("blockquoteRule", /^>\s$/,
        {
            type: 'node',
            nodeType: TokenEnum.Blockquote,
            whenReplace: 'type',
            wrapStrategy: 'WrapBlock'
        }
    );

    // Code Block Rule: Matches triple backticks
    extension.registerRule("codeBlockRule", /^```(.*)\s*$/,
        {
            type: 'node',
            nodeType: TokenEnum.CodeBlock,
            whenReplace: 'enter',
            getAttribute: (match): CodeBlockAttrs => {
                const lang = match[1];
                return {
                    lang: lang ?? 'Unknown',
                };
            },
            wrapStrategy: 'WrapTextBlock'
        }
    );

    extension.registerRule("orderedListRule", /^(\d+)\.\s$/,
        {
            type: 'node',
            nodeType: TokenEnum.List,
            whenReplace: 'type',
            getAttribute: (match) => {
                if (match && match[1]) {
                    return { ordered: true, start: parseInt(match[1]) };
                }
                return { ordered: true, start: 1, };
            },
            shouldJoinWithBefore: (match, prevNode) => {
                if (match && match[1]) {
                    return prevNode.type.name === TokenEnum.List && prevNode.attrs["order"] + 1 === +match[1];
                }
                return false;
            },
            wrapStrategy: 'WrapBlock'
        }
    );

    extension.registerRule("bulletListRule", /^\s*([-+*])\s$/,
        {
            type: 'node',
            nodeType: TokenEnum.List,
            whenReplace: 'type',
            wrapStrategy: 'WrapBlock'
        }
    );

    extension.registerRule("strongRule", /\*\*(.+?)\*\*$/, {
        type: 'mark',
        markType: MarkEnum.Strong,
        whenReplace: 'type',
        preventMarkInheritance: true,
    });

    extension.registerRule("emphasisRule", /\*(.+?)\*$/, {
        type: 'mark',
        markType: MarkEnum.Em,
        whenReplace: 'type',
        preventMarkInheritance: true,
    });

    const ESCAPE_REGEX = /`(?![`]{2})((?:\\`|[^`])+?)`(?![`]{2})$/;
    extension.registerRule("codespanRule", ESCAPE_REGEX, {
        type: 'mark',
        markType: MarkEnum.Codespan,
        whenReplace: 'type',
        preventMarkInheritance: true,
    });

    extension.registerRule("mathBlockRule", /^\$\$$/,
        {
            type: 'node',
            nodeType: TokenEnum.MathBlock,
            whenReplace: 'enter',
            wrapStrategy: 'ReplaceBlock',
        }
    );

    extension.registerRule("mathInlineRule", /\$(.+?)\$$/, {
        type: 'node',
        nodeType: TokenEnum.MathInline,
        whenReplace: 'type',
        wrapStrategy: 'ReplaceBlock',
        getAttribute: (matched) => {
            return {
                text: matched[1],
            };
        }
    });
}
