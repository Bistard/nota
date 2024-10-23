import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMark, ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IDocumentMarkSerializationOptions, IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

const enum EmType {
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

    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            parseDOM: [
                { tag: 'i' }, 
                { tag: 'em' }, 
                { style: 'font-style=italic' }
            ],
            attrs: {
                type: { default: EmType.asterisk },
            },
            toDOM: () => { return ['em', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Em): void {
        const type = token.raw.at(0) === '*' ? EmType.asterisk : EmType.underscore;
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
        const type = mark.attrs['type'] as EmType;
        return type === EmType.asterisk ? '*' : '_';
    }
}