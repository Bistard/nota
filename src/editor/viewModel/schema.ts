import { MarkEnum, TokenEnum } from "src/editor/common/markdown";
import { MarkSpec, NodeSpec, ProseNodeType, ProseSchema } from "src/editor/common/prose";

export class EditorSchema extends ProseSchema<string, string> {

	public getNodeType(name: string): ProseNodeType | undefined {
		return this.nodes[name];
	}
}

export class MarkdownSchema extends EditorSchema  {

	constructor() {
		super({
			nodes: MarkdownSchema.getNodeSpecs(),
			marks: MarkdownSchema.getMarksSpecs(),
			topNode: 'doc',
		});
	}

	private static getNodeSpecs(): Record<string, NodeSpec> {
		return {
			/**
			 * NodeSpec The top level document node.
			 */
			doc: <NodeSpec>{
				content: "block+",
			},

			/**
			 * A plain paragraph textblock. Represented in the DOM as a `<p>` 
			 * element.
			 */
			[TokenEnum.Paragraph]: <NodeSpec>{
				content: "inline*",
				group: "block",
				parseDOM: [{ tag: "p" }],
				toDOM: () => { return ["p", 0]; }
			},

			/**
			 * A blockquote (`<blockquote>`) wrapping one or more blocks.
			 */
			 [TokenEnum.Blockquote]: <NodeSpec>{
				content: "block+",
				group: "block",
				defining: true,
				parseDOM: [{ tag: "blockquote" }],
				toDOM: () => { return ["blockquote", 0]; }
			},

			/**
			 * A horizontal rule (`<hr>`).
			 */
			[TokenEnum.HorizontalRule]: <NodeSpec>{
				content: undefined,
				group: "block",
				parseDOM: [{ tag: "hr" }],
				toDOM: () => { return ["hr"]; }
			},

			/**
			 * A heading textblock, with a `level` attribute that should hold 
			 * the number 1 to 6. Parsed and serialized as `<h1>` to `<h6>` 
			 * elements.
			 */
			 [TokenEnum.Heading]: <NodeSpec>{
				attrs: { level: { default: 1 } },
				content: "inline*",
				group: "block",
				defining: true,
				parseDOM: [
					{ tag: "h1", attrs: { level: 1 } },
					{ tag: "h2", attrs: { level: 2 } },
					{ tag: "h3", attrs: { level: 3 } },
					{ tag: "h4", attrs: { level: 4 } },
					{ tag: "h5", attrs: { level: 5 } },
					{ tag: "h6", attrs: { level: 6 } },
				],
				toDOM(node) { return ["h" + node.attrs['level'], 0]; }
			},

			/**
			 * A code listing. Disallows marks or non-text inline nodes by 
			 * default. Represented as a `<pre>` element with a `<code>` element 
			 * inside of it.
			 */
			 [TokenEnum.CodeBlock]: <NodeSpec>{
				content: "text*",
				group: "block",
				marks: "",
				code: true,
				defining: true,
				parseDOM: [
					{ tag: "pre", preserveWhitespace: "full" },
				],
				toDOM: () => { return ["pre", ["code", 0]]; }
			},

			/**
			 * The plain-text node.
			 */
			 [TokenEnum.Text]: <NodeSpec>{
				group: "inline"
			},

			/**
			 * An inline image (`<img>`) node. Supports `src`, `alt`, and `href` 
			 * attributes. The latter two default to the empty string.
			 */
			 [TokenEnum.Image]: <NodeSpec>{
				inline: true,
				attrs: {
					src: {},
					alt: { default: null },
					title: { default: null }
				},
				group: "inline",
				draggable: true,
				parseDOM: [
					{
						tag: "img[src]", 
						getAttrs: (dom: HTMLElement) => {
							return {
								src: dom.getAttribute("src"),
								title: dom.getAttribute("title"),
								alt: dom.getAttribute("alt")
							};
						}
					}
				],
				toDOM: (node) => {
					const { src, alt, title } = node.attrs;
					return ["img", { src, alt, title }];
				}
			},

			/**
			 * A hard line break, represented in the DOM as `<br>`.
			 */
			 [TokenEnum.LineBreak]: <NodeSpec>{
				inline: true,
				group: "inline",
				selectable: false,
				parseDOM: [{ tag: "br" }],
				toDOM: () => { return ["br"]; }
			},
		};
	}

	private static getMarksSpecs(): Record<string, MarkSpec> {
		return {
			/**
			 * A link. Has `href` and `title` attributes. `title` defaults to 
			 * the empty string. Rendered and parsed as an `<a>` element.
			 */
			 [MarkEnum.Link]: <MarkSpec>{
				attrs: {
					href: {},
					title: { default: null }
				},
				inclusive: false,
				parseDOM: [
				{
					tag: "a[href]", 
					getAttrs: (dom: HTMLElement) => {
						return {
							href: dom.getAttribute("href"),
							title: dom.getAttribute("title"),
						};
					}
				}],
				toDOM: (node) => {
					const { href, title } = node.attrs;
					return ["a", { href, title }, 0];
				}
			},

			/**
			 * An emphasis mark. Rendered as an `<em>` element. Has parse rules
			 * that also match `<i>` and `font-style: italic`.
			 */
			 [MarkEnum.Em]: <MarkSpec>{
				parseDOM: [
					{ tag: "i" }, 
					{ tag: "em" }, 
					{ style: "font-style=italic" }
				],
				toDOM: () => { return ["em", 0]; }
			},

			/**
			 * A strong mark. Rendered as `<strong>`, parse rules also match
			 * `<b>` and `font-weight: bold`.
			 */
			 [MarkEnum.Strong]: <MarkSpec>{
				parseDOM: [
					{ tag: "strong" },
					/**
					 * This works around a Google Docs misbehavior where pasted 
					 * content will be inexplicably wrapped in `<b>` tags with a 
					 * font-weight normal.
					 */
					{ 
						tag: "b", 
						getAttrs: (node: HTMLElement) => (node.style.fontWeight != "normal") && null 
					},
					{ 
						style: "font-weight", 
						getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null 
					}
				],
				toDOM: () => { return ["strong", 0]; }
			},

			/**
			 * Code font mark. Represented as a `<code>` element.
			 */
			[MarkEnum.CodeInline]: <MarkSpec>{
				parseDOM: [{ tag: "code" }],
				toDOM: () => { return ["code", 0]; }
			}
		};
	}
}