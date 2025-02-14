import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { Strings } from "src/base/common/utilities/string";
import { assert } from "src/base/common/utilities/panic";
import { memoize } from "src/base/common/memoization";

export type BlockquoteAttrs = {
    // noop for now
};

/**
 * @class A blockquote (`<blockquote>`) wrapping one or more blocks.
 */
export class Blockquote extends DocumentNode<EditorTokens.Blockquote> {

    constructor() {
        super(TokenEnum.Blockquote);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'block+',
            defining: true,
            attrs: {
                delimiters: { default: [] },
            } satisfies GetProseAttrs<BlockquoteAttrs>,
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: `blockquote`,
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Blockquote>): void {
        const { token } = status;
        const delimiters = this.__getDelimitersFromRaw(state, token.raw);

        state.activateNode(this.ctor, status, {
            attrs: { delimiters: delimiters }
        });
        
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        }
        
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode) => {
        const delimiters = node.attrs['delimiters'] as string[];
        state.serializeDelimitedBlock(delimiters, node);
    };

    // [private methods]

    private __getDelimitersFromRaw(state: IDocumentParseState, raw: string): string[] {
        const delimiters: string[] = [];
        const activeNode = assert(state.getActiveNode());
        const outMost = (activeNode.name !== TokenEnum.Blockquote);

        for (const { line, isLastLine } of Strings.iterateLines(raw)) {
            if (line === '') {
                continue;
            }

            /**
             * For cases like '> p1\n  <br>', the second line '  <br>' is 
             * considered part of the blockquote. This line could logically 
             * contain any text.
             * 
             * If the last line includes the character `>`, it can interfere with 
             * the algorithm's parsing. To avoid this, special handling is required.
             */
            if (isLastLine && /^ {0,3}>/.test(line) === false) {
                delimiters.push('');
                continue;
            }

            let delimiter = '';
            let startIndex = 0;

            // edge case: append the spaces before the first level '>' to the delimiter
            if (outMost) {
                const { index: firstLevelIdx, str: spaces } = Strings.substringUntilChar2(line, '>', 0);
                delimiter += spaces;
                delimiter += '>';
                startIndex = firstLevelIdx + 1;
            } else {
                delimiter = '>';
                startIndex = 1;
            }

            // normal case: append the spaces after the '>' to the delimiter
            const { index: nextCharIdx, char: nextChar } = Strings.firstNonSpaceChar(line, startIndex);
            
            // empty line, skip it.
            if (nextChar === '') {
                delimiters.push(delimiter);
                continue;
            }
            
            // we append the spaces before the nextChar
            const space = line.slice(startIndex, nextCharIdx);
            delimiter += space;
            delimiters.push(delimiter);
        }

        return delimiters;
    }
}