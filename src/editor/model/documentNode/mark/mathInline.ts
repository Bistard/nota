import { TokenizerAndRendererExtension } from "marked";

const inlineRule = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1(?=[\s?!.,:？！。，：]|$)/;
const inlineRuleNonStandard = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n$]))\1/; // Non-standard, even if there are no spaces before and after $ or $$, try to parse

export function createMathInlineTokenizer(options: { nonStandard: boolean }): TokenizerAndRendererExtension {
    const {nonStandard} = options;
    const ruleReg = nonStandard ? inlineRuleNonStandard : inlineRule;
    return {
        name: 'mathInline',
        level: 'inline',
        start(src) {
            let index: number;
            let indexSrc = src;
            while (indexSrc) {
                index = indexSrc.indexOf('$');
                if (index === -1) {
                    return;
                }
                const found = nonStandard ? index > -1 : index === 0 || indexSrc.charAt(index - 1) === ' ';
                if (found) {
                    const possibleInline = indexSrc.substring(index);
                    if (possibleInline.match(ruleReg)) {
                        return index;
                    }
                }
                indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
            }
        },
        tokenizer(src, tokens) {
            const match = src.match(ruleReg);
            if (match) {
                return {
                    type: 'mathInline',
                    raw: match[0],
                    text: match[2]!.trim(),
                    displayMode: match[1]!.length === 2,
                };
            }
        }
    };
}