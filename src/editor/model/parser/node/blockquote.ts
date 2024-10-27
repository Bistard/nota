import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { createDomOutputFromOptions } from "../../schema";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";
import { Strings } from "src/base/common/utilities/string";
import { assert } from "src/base/common/utilities/panic";

/**
 * @class A blockquote (`<blockquote>`) wrapping one or more blocks.
 */
export class Blockquote extends DocumentNode<EditorTokens.Blockquote> {

    constructor() {
        super(TokenEnum.Blockquote);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: 'block+',
            defining: true,
            attrs: {
                delimiters: { default: [] },
            },
            toDOM: () => { 
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: `blockquote`,
                    editable: true,
                });
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Blockquote): void {
        const delimiters = this.__getDelimitersFromRaw(state, token.raw);
        state.activateNode(this.ctor, { delimiters: delimiters });
        if (token.tokens) {
            state.parseTokens(token.tokens, token);
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
        for (const { line } of Strings.iterateLines(raw)) {
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