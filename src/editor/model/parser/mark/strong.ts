import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IDocumentMarkSerializationOptions, IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

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

    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            attrs: {
                type: { default: StrongType.asterisk },
            },
            toDOM: () => { return ['strong', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Strong): void {
        const type = token.raw.at(0) === '*' ? StrongType.asterisk : StrongType.underscore;
        state.activateMark(this.ctor.create({ type: type }));
        if (token.tokens) {
            state.parseTokens(token.tokens, token);
        } else {
            state.addText(token.text);
        }
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (state, mark) => this.__getOpenAndClose(state, mark),
        serializeClose: (state, mark) => this.__getOpenAndClose(state, mark),
        mixable: true,
        expelEnclosingWhitespace: true,
    };

    private __getOpenAndClose(state: IMarkdownSerializerState, mark: ProseMark): string {
        const type = mark.attrs['type'] as StrongType;
        return type === StrongType.asterisk ? '**' : '__';
    }
}