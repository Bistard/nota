import { TokenizerAndRendererExtension } from "marked";

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
