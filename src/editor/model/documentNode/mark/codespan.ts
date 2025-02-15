import { memoize } from "src/base/common/memoization";
import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec, ProseNode } from "src/editor/common/proseMirror";
import { DocumentMark, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IDocumentMarkSerializationOptions, IMarkdownSerializerState } from "src/editor/model/serializer";

/**
 * @class Code font mark. Represented as a `<code>` element.
 */
export class Codespan extends DocumentMark<EditorTokens.Codespan> {

    constructor() {
        super(MarkEnum.Codespan);
    }

    @memoize
    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                backtickCount: { default: 1 },
            },
            toDOM: () => { return ['code', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, { token }: IParseTokenStatus<EditorTokens.Codespan>): void {
        let backtickCount = 0;
        for (const c of token.raw) {
            if (c !== '`') {
                break;
            }
            backtickCount++;
        }
        const rawText = token.raw.slice(backtickCount, -backtickCount);
        state.activateMark(this.ctor.create({ backtickCount: backtickCount }));
        state.addText(rawText);
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (_state, mark) => __getOpenAndClose(mark),
        serializeClose: (_state, mark) => __getOpenAndClose(mark),
        escape: false,
    };
}

function __getOpenAndClose(mark: ProseMark): string {
    const backtickCount = mark.attrs['backtickCount'] as number;
    return '`'.repeat(backtickCount);
}