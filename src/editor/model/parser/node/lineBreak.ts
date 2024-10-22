import { Strings } from "src/base/common/utilities/string";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class A hard line break, represented in the DOM as `<br>`.
 */
export class LineBreak extends DocumentNode<EditorTokens.Br> {

    constructor() {
        super(TokenEnum.LineBreak);
    }

    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'inline',
            inline: true,
            selectable: false,
            parseDOM: [{ tag: 'br' }],
            toDOM: () => { return ['br']; },
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Br): void {
        const spacesBeforeLineBreak = Strings.substringUntilChar(token.raw, '\n');
        if (spacesBeforeLineBreak.length > 0) {
            state.addText(spacesBeforeLineBreak);
        }

        state.activateNode(this.ctor);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        for (let i = index + 1; i < parent.childCount; i++) {
            if (parent.child(i).type !== node.type) {
                state.write("\n");
                return;
            }
        }
    };
}