import { panic } from "src/base/common/utilities/panic";
import { Dictionary } from "src/base/common/utilities/type";
import { ProseDOMOutputSpec } from "src/editor/common/proseMirror";
import { ProseMark, ProseMarkSpec, ProseMarkType, ProseNodeSpec, ProseNodeType, ProseSchema, IProseTextNode } from "src/editor/common/proseMirror";
import { DocumentNodeProvider } from "src/editor/model/documentNode/documentNodeProvider";

/**
 * The top level document node.
 */
export const TOP_NODE_NAME = 'doc';

/**
 * A document schema. Holds [node](https://prosemirror.net/docs/ref/#model.NodeType) and [mark
 * type](https://prosemirror.net/docs/ref/#model.MarkType) objects for the nodes and marks that may
 * occur in conforming documents, and provides functionality for
 * creating and deserializing such documents.
 * 
 * When given, the type parameters provide the names of the nodes and
 * marks in this schema.
*/
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

export function buildSchema(nodeProvider: DocumentNodeProvider): EditorSchema {
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

	// construct schema
	const editorSchema = new EditorSchema({
		topNode: TOP_NODE_NAME,
		nodes: nodeSpec,
		marks: markSpec,
	});

	/**
	 * Must initializes the provider after the schema is constructed otherwise
	 * the 'ctor' field of each nodes will not work.
	 */
	nodeProvider.init(editorSchema);

	return editorSchema;
}

// #region `createDomOutputFromOptions`

/**
 * Type representing different options for DOM output specification when
 * ProseMirror is parsing from a {@link ProseNode} to the real DOM.
 * It can be either:
 *  - a text node,
 *  - a DOM node,
 *  - or a nested node.
 */
export type DomOutputOptions =
    DomOutputTextNode |
    DomOutputDomNode |
    DomOutputNode;

/**
 * Type representing a node which is interpreted as a text node.
 */
export type DomOutputTextNode = {
    readonly type: 'text';
    readonly text: string;
};

/**
 * Type representing a node which is interpreted as the DOM node itself.
 */
export type DomOutputDomNode = {
    readonly type: 'dom';
    readonly dom: HTMLElement;
    readonly contentDom?: HTMLElement;
};

/**
 * Type representing a node which is interpreted as nested nodes.
 */
export type DomOutputNode = {
    readonly type: 'node';
    readonly tagName: string;
    readonly attributes?: Dictionary<string, string>;
} & (
        /**
         * Either the node is editable
         */
        {
            /**
             * @note When this sets to `true`, the will ONLY be a placeholder, a `0`,
             *       a.k.a the 'hole', appended to the parent. Because the placeholder
             *       must be the only child of the parent.
             * @note The 'hole' is used to indicate the place where a node's child
             *       nodes should be inserted.
             */
            readonly editable: true;
        } |
        // or the parent contains children
        {
            readonly editable: false;
            readonly children?: DomOutputOptions[];
        });

/**
 * @description A helper function that uses our own defined interface to create
 * a ProseMirror {@link ProseDOMOutputSpec}.
 * @param option The DOM output option to be converted.
 * @returns The ProseMirror DOM output specification.
 *
 * @panic If the type of {@link DomOutputOptions} is unknown.
 */
export function createDomOutputFromOptions(option: DomOutputOptions): ProseDOMOutputSpec {
    switch (option.type) {
        case 'text':
            return option.text;
        case 'dom':
            if (!option.contentDom) {
                return option.dom;
            }
            return { dom: option.dom, contentDOM: option.contentDom };
        case 'node': {
            const { tagName, attributes, editable } = option;
            const output: [string, ...any[]] = [tagName];

            if (attributes) {
                output.push(attributes);
            }

            // the placeholder can only be the only child of the parent
            if (editable === true) {
                output.push(0);
            }

            // if children is provided
            else {
                const { children } = option;
                for (const child of children ?? []) {
                    output.push(createDomOutputFromOptions(child));
                }
            }

            return output;
        }
        default:
            panic(`[createDomOutputFromOptions] Unknown DomOutputOptions type: '${option['type']}'`);
    }
}