import { memoize } from "src/base/common/memoization";
import { Strings } from "src/base/common/utilities/string";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

/**
 * @class A hard line break, represented in the DOM as `<br>`.
 */
export class LineBreak extends DocumentNode<EditorTokens.Br> {

    constructor() {
        super(TokenEnum.LineBreak);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'inline',
            inline: true,
            selectable: false,
            toDOM: () => { return ['br']; },
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.Br>): void {
        const { token } = status;
        const spacesBeforeLineBreak = Strings.substringUntilChar(token.raw, '\n');
        if (spacesBeforeLineBreak.length > 0) {
            state.addText(spacesBeforeLineBreak);
        }

        state.activateNode(this.ctor, status, {});
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