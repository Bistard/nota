import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IDocumentMarkSerializationOptions } from "src/editor/model/serializer/serializer";

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
            parseDOM: [
                { tag: 'strong' },
                /**
                 * This works around a Google Docs misbehavior where pasted 
                 * content will be inexplicably wrapped in `<b>` tags with a 
                 * font-weight normal.
                 */
                { 
                    tag: 'b', 
                    getAttrs: (node: HTMLElement) => (node.style.fontWeight !== 'normal') && null 
                },
                { 
                    style: 'font-weight', 
                    getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null 
                }
            ],
            toDOM: () => { return ['strong', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Strong): void {
        state.activateMark(this.ctor.create());
        state.addText(token.text);
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: () => '**',
        serializeClose: () => '**',
        mixable: true,
        expelEnclosingWhitespace: true,
    };
}