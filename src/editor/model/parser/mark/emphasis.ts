import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IDocumentMarkSerializationOptions } from "src/editor/model/serializer/serializer";

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
            toDOM: () => { return ['em', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Em): void {
        state.activateMark(this.ctor.create());
        if (token.tokens) {
            state.parseTokens(token.tokens);
        } else {
            state.addText(token.text);
        }
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: () => '*',
        serializeClose: () => '*',
        mixable: true,
        expelEnclosingWhitespace: true,
    };
}