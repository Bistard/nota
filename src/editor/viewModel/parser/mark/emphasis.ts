import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec } from "src/editor/common/prose";
import { DocumentMark } from "src/editor/viewModel/parser/documentNode";
import { IDocumentParseState } from "src/editor/viewModel/parser/documentParser";

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
        state.addText(token.text);
        state.deactivateMark(this.ctor);
    }
}