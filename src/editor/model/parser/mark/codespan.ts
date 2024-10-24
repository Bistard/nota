import { MarkEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseMarkSpec, ProseNode } from "src/editor/common/proseMirror";
import { DocumentMark } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { IDocumentMarkSerializationOptions } from "src/editor/model/serializer/serializer";

/**
 * @class Code font mark. Represented as a `<code>` element.
 */
export class Codespan extends DocumentMark<EditorTokens.Codespan> {

    constructor() {
        super(MarkEnum.Codespan);
    }

    public getSchema(): ProseMarkSpec {
        return <ProseMarkSpec>{
            toDOM: () => { return ['code', 0]; }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.Codespan): void {
        state.activateMark(this.ctor.create());
        state.addText(token.text);
        state.deactivateMark(this.ctor);
    }

    public readonly serializer: IDocumentMarkSerializationOptions = {
        serializeOpen: (_1, _2, parent, index) => __backticksFor(parent.child(index), -1),
        serializeClose: (_1, _2, parent, index) => __backticksFor(parent.child(index), 1),
    };
}

function __backticksFor(node: ProseNode, side: number): string {
    const backtickPattern = /`+/g;
    let maxBacktickLength = 0;
    let match: RegExpExecArray | null;

    // Find the longest sequence of backticks in the text node
    if (node.isText) {
        while ((match = backtickPattern.exec(node.text!)) !== null) {
            maxBacktickLength = Math.max(maxBacktickLength, match[0].length);
        }
    }

    // Construct the result string with the appropriate number of backticks
    let result = maxBacktickLength > 0 && side > 0 ? " `" : "`";
    result += "`".repeat(maxBacktickLength);
    
    // Add trailing space if the side is negative
    if (maxBacktickLength > 0 && side < 0) {
        result += " ";
    }

    return result;
}