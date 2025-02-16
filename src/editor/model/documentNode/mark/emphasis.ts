import { memoize } from "src/base/common/memoization";
import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IDocumentMarkSerializationOptions, IMarkdownSerializerState } from "src/editor/model/serializer";

export const enum EmType {
    underscore = 'underscore',
    asterisk = 'asterisk',
}

/**
 * @class An emphasis mark. Rendered as an `<em>` element. Has parse rules that 
 * also match `<i>` and `font-style: italic`.
 */
export class Emphasis extends DocumentMark<EditorTokens.Em> {

    constructor() {
        super(MarkEnum.Em);
    }

    @memoize
    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                type: { default: EmType.asterisk },
            },
            toDOM: () => { return ['em', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Em>): void {
        const { token } = status;
        const type = token.raw.at(0) === '*' ? EmType.asterisk : EmType.underscore;
        state.activateMark(this.ctor.create({ type: type }));
        if (token.tokens) {
            state.parseTokens(status.level + 1, token.tokens, token);
        } else {
            state.addText(token.text);
        }
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (_state, mark) => this.__getOpenAndClose(mark),
        serializeClose: (_state, mark) => this.__getOpenAndClose(mark),
        mixable: true,
        expelEnclosingWhitespace: true,
    };

    private __getOpenAndClose(mark: ProseMark): string {
        const type = mark.attrs['type'] as EmType;
        return type === EmType.asterisk ? '*' : '_';
    }
}