import { TokenizerAndRendererExtension } from "marked";
import { memoize } from "src/base/common/memoization";
import { SmartRegExp } from "src/base/common/utilities/regExp";
import { TokenEnum } from "src/editor/common/markdown";
import { renderMath } from "src/editor/common/math";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { II18nService } from "src/platform/i18n/browser/i18nService";

export const mathBlockRule = 
    new SmartRegExp(/^dollarLine\n(contentLine)dollarLine/)
    .replace('dollarLine', /(?:dollars)\s*/)
    .replace('contentLine', /(?:singleLine\n)*/) // multiple line: allow to be empty
    .replace('singleLine', /(?!dollars)[^\n]*/) // single line: not allow occurrence of `$$`
    .replace('dollars', /\${2}/)
    .get();

export function createMathBlockTokenizer(): TokenizerAndRendererExtension {
    return {
        name: 'mathBlock',
        level: 'block',
        start: (src: string) => {
            return src.match(/^\${2}/m)?.index;
        },
        tokenizer: (src: string, tokens: any) => {
            const match = src.match(mathBlockRule);
            if (match) {
                return {
                    type: 'mathBlock',
                    raw: match[0],
                    text: match[1]!.trim(),
                };
            }
        },
    };
}

export type MathBlockAttrs = {
    /**
     * @default ''
     */
    readonly text?: string;
};

export class MathBlock extends DocumentNode<EditorTokens.MathBlock> {

    constructor(
        @II18nService private readonly i18nService: II18nService,
    ) {
        super(TokenEnum.MathBlock);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            draggable: true,
            selectable: true,
            attrs: {
                text: { default: '' },
            } satisfies GetProseAttrs<MathBlockAttrs>,
            toDOM: (node) => { 
                const text = node.attrs['text'] as string;
                const dom = document.createElement('div');
                renderMath(this.i18nService, text, dom, 'block');
                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.MathBlock>): void {
        const token = status.token;
        state.activateNode(this.ctor, status, {
            attrs: {
                text: token.text,
            }
        });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { text } = node.attrs;
        state.write(`$$${text}$$`);
    };
}