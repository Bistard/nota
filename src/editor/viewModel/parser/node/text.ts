import { TokenEnum } from "src/editor/common/markdown";
import { ProseNodeSpec } from "src/editor/common/prose";
import { DocumentNode, IDocumentNodeType } from "src/editor/viewModel/parser/documentNode";

export class Text extends DocumentNode {

    constructor() {
        super(TokenEnum.Text);
    }

    public get type(): IDocumentNodeType {
        return IDocumentNodeType.Text;
    }
    
    public getSchema(): ProseNodeSpec {
        return {};
    }
}