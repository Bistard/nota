import { Strings } from "src/base/common/utilities/string";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

const enum HrType {
    Dash = 'dash',
    Asterisk = 'asterisk',
    Underline = 'underline'
}

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
            attrs: {
                type: { default: HrType.Dash },
                raw: { default: '---' }
            },
            parseDOM: [{ tag: 'hr' }],
            toDOM: () => { return ['hr']; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Hr): void {
        const raw = token.raw;
        state.activateNode(this.ctor, { 
            type: __getHrType(raw),
            raw: raw
        });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const raw = node.attrs['raw'] as string;
        state.write(raw);
        state.closeBlock(node);
    };
}


function __getHrType(text: string): HrType {
    const firstChar = text.charAt(0);
    switch (firstChar) {
        case '-': return HrType.Dash;
        case '*': return HrType.Asterisk;
        case '_': return HrType.Underline;
        default: return HrType.Dash;
    }
}