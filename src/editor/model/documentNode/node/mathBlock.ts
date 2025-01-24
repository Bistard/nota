import katex from "katex";
import { TokenizerAndRendererExtension } from "marked";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

export function createMathBlockTokenizer(): TokenizerAndRendererExtension {
    return {
        name: 'mathBlock',
        level: 'block',
        tokenizer: (src: string, tokens: any) => {
            const match = src.match(blockRule);
            if (match) {
                return {
                    type: 'mathBlock',
                    raw: match[0],
                    text: match[2]!.trim(),
                    displayMode: match[1]!.length === 2,
                };
            }
        },
    };
}

export class MathBlock extends DocumentNode<EditorTokens.MathBlock> {

    constructor() {
        super(TokenEnum.MathBlock);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            draggable: true,
            selectable: true,
            attrs: {
                text: { default: '' },
            },
            toDOM: (node) => { 
                const text = node.attrs['text'] as string;
                const dom = document.createElement('div');


                katex.render(text, dom, {
                    displayMode: true,
                    output: 'htmlAndMathml',
                    throwOnError: false,
                });

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