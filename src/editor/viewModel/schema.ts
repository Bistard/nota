import { Dictionary } from "src/base/common/util/type";
import { ProseMark, ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType, ProseSchema, IProseTextNode } from "src/editor/common/proseMirror";
import { DocumentNodeProvider } from "src/editor/viewModel/parser/documentNode";

/**
 * The top level document node.
 */
export const TOP_NODE_NAME = 'doc';

export class EditorSchema extends ProseSchema<string, string> {

	public getNodeType(name: string): ProseNodeType | undefined {
		return this.nodes[name];
	}

	public getMarkType(name: string): ProseMarkType | undefined {
		return this.marks[name];
	}

	public override text(text: string, marks?: readonly ProseMark[]): IProseTextNode {
		return <IProseTextNode>super.text(text, marks);
	}
}

export class MarkdownSchema extends EditorSchema  {

	constructor(nodeProvider: DocumentNodeProvider) {
		const nodeSpec: Dictionary<string, ProseNodeSpec> = { [TOP_NODE_NAME]: <ProseNodeSpec>{ content: 'block+' } };
		const markSpec: Dictionary<string, ProseMarkSpec> = {};
		
		const nodes = nodeProvider.getRegisteredNodes();
		for (const node of nodes) {
			nodeSpec[node.name] = node.getSchema();
		}

		const marks = nodeProvider.getRegisteredMarks();
		for (const mark of marks) {
			markSpec[mark.name] = mark.getSchema();
		}

		super({
			topNode: TOP_NODE_NAME,
			nodes: nodeSpec,
			marks: markSpec,
		});

		/**
		 * Must initizes the proivder after the schema is constructed otherwise
		 * the 'ctor' field of each nodes will not work.
		 */
		nodeProvider.init(this);
	}
}