import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class A horizontal rule (`<hr>`).
 */
export class HorizontalRule extends DocumentNode<EditorTokens.Hr> {

    constructor() {
        super(TokenEnum.HorizontalRule);
    }

    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'block',
            content: undefined,
            parseDOM: [{ tag: 'hr' }],
            toDOM: () => { return ['hr']; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Hr): void {
        state.activateNode(this.ctor);
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        state.write('---');
        state.closeBlock(node);
    };
}