import { TokenEnum } from "src/editor/common/markdown";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode, IDocumentNodeType } from "src/editor/viewModel/parser/documentNode";

export class Blockquote extends DocumentNode {

    constructor() {
        super(TokenEnum.Blockquote);
    }

    public get type(): IDocumentNodeType {
        return IDocumentNodeType.Block;
    }

    public getSchema(): ProseNodeSpec {
        return {};
    }
}