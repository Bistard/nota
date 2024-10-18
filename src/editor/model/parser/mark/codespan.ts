import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";

/**
 * @class Code font mark. Represented as a `<code>` element.
 */
export class Codespan extends DocumentMark<EditorTokens.Codespan> {

    constructor() {
        super(MarkEnum.Codespan);
    }

    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            parseDOM: [{ tag: 'code' }],
            toDOM: () => { return ['code', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Codespan): void {
        state.activateMark(this.ctor.create());
        state.addText(token.text);
        state.deactivateMark(this.ctor);
    }
}