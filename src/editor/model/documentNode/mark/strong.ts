import { memoize } from "src/base/common/memoization";
import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IDocumentMarkSerializationOptions, IMarkdownSerializerState } from "src/editor/model/serializer";

export const enum StrongType {
    underscore = 'underscore',
    asterisk = 'asterisk',
}

/**
 * @class A strong mark. Rendered as `<strong>`, parse rules also match `<b>` 
 * and `font-weight: bold`.
 */
export class Strong extends DocumentMark<EditorTokens.Strong> {

    constructor() {
        super(MarkEnum.Strong);
    }

    @memoize
    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                type: { default: StrongType.asterisk },
            },
            toDOM: () => { return ['strong', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Strong>): void {
        const { token } = status;
        const type = token.raw.at(0) === '*' ? StrongType.asterisk : StrongType.underscore;
        state.activateMark(this.ctor.create({ type: type }));
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        } else {
            state.addText(token.text);
        }
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (_state, mark) => __getOpenAndClose(mark),
        serializeClose: (_state, mark) => __getOpenAndClose(mark),
        mixable: true,
        expelEnclosingWhitespace: true,
    };
}

function __getOpenAndClose(mark: ProseMark): string {
    const type = mark.attrs['type'] as StrongType;
    return type === StrongType.asterisk ? '**' : '__';
}