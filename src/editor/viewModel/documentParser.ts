import { EditorToken } from "src/editor/common/model";
import { ProseAttrs, ProseMark, ProseNode, ProseNodeType, ProseSchema } from "src/editor/common/prose";

interface ParseNode {
    readonly type: ProseNodeType;
    readonly children: ParseNode[];
    readonly marks: ProseMark[];
    readonly attrs?: ProseAttrs;
}

export class DocumentParser {
    
    // [field]

    private readonly _schema: ProseSchema;
    private readonly _tokens: EditorToken[];
    private readonly _stack: ParseNode[];

    // [private constructor]

    /**
     * The reason to make the constructor private is to avoid accidently holding 
     * the data references. To release the references properly, this is where
     * the static method {@link DocumentParser.parse} comes in.
     */
    private constructor(
        schema: ProseSchema,
        tokens: EditorToken[],
    ) {
        this._schema = schema;
        this._tokens = tokens;
        this._stack = [];
    }

    // [public static methods]

    public static parse(
        schema: ProseSchema,
        tokens: EditorToken[],
    ): ProseNode | null {
        const parser = new DocumentParser(schema, tokens);
        return parser.parse();
    }

    // [public methods]

    public parse(): ProseNode | null {
        

        return this._schema.topNodeType.createAndFill();
    }

    // [private helper methods]

}