import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { ProseMark, ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType, ProseSchema, ProseTextNode } from "src/editor/common/prose";
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

	public override text(text: string, marks?: readonly ProseMark[]): ProseTextNode {
		return <ProseTextNode>super.text(text, marks);
	}
}

export class MarkdownSchema extends EditorSchema  {

	constructor(nodeProvider: DocumentNodeProvider) {
		const nodeSpec: Record<string, ProseNodeSpec> = { [TOP_NODE_NAME]: <ProseNodeSpec>{ content: 'block+' } };
		const markSpec: Record<string, ProseMarkSpec> = {};
		
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

	// TODO
	private static getNodeSpecs(): Record<string, ProseNodeSpec> {
		return {

			/**
			 * A horizontal rule (`<hr>`).
			 */
			[TokenEnum.HorizontalRule]: <ProseNodeSpec>{
				group: 'block',
				content: undefined,
				parseDOM: [{ tag: 'hr' }],
				toDOM: () => { return ['hr']; }
			},

			/**
			 * A code listing. Disallows marks or non-text inline nodes by 
			 * default. Represented as a `<pre>` element with a `<code>` element 
			 * inside of it.
			 */
			[TokenEnum.CodeBlock]: <ProseNodeSpec>{
				content: 'text*',
				group: 'block',
				marks: '',
				code: true,
				defining: true,
				parseDOM: [
					{ tag: 'pre', preserveWhitespace: 'full' },
				],
				toDOM: () => { return ['pre', ['code', 0]]; }
			},

			/**
			 * An inline image (`<img>`) node. Supports `src`, `alt`, and `href` 
			 * attributes. The latter two default to the empty string.
			 */
			[TokenEnum.Image]: <ProseNodeSpec>{
				inline: true,
				attrs: {
					src: {},
					alt: { default: null },
					title: { default: null }
				},
				group: 'inline',
				draggable: true,
				parseDOM: [
					{
						tag: 'img[src]', 
						getAttrs: (dom: HTMLElement) => {
							return {
								src: dom.getAttribute('src'),
								title: dom.getAttribute('title'),
								alt: dom.getAttribute('alt')
							};
						}
					}
				],
				toDOM: (node) => {
					const { src, alt, title } = node.attrs;
					return ['img', { src, alt, title }];
				}
			},

			/**
			 * A hard line break, represented in the DOM as `<br>`.
			 */
			[TokenEnum.LineBreak]: <ProseNodeSpec>{
				inline: true,
				group: 'inline',
				selectable: false,
				parseDOM: [{ tag: 'br' }],
				toDOM: () => { return ['br']; }
			},
		};
	}

	private static getMarksSpecs(): Record<string, ProseMarkSpec> {
		return {
			/**
			 * Code font mark. Represented as a `<code>` element.
			 */
			[MarkEnum.CodeInline]: <ProseMarkSpec>{
				parseDOM: [{ tag: 'code' }],
				toDOM: () => { return ['code', 0]; }
			}
		};
	}
}