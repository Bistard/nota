import { Arrays } from "src/base/common/utilities/array";
import { ref, Ref } from "src/base/common/utilities/object";
import { assert, panic } from "src/base/common/utilities/panic";
import { TokenEnum } from "src/editor/common/markdown";
import { ProseMark, ProseNode } from "src/editor/common/proseMirror";
import { DocumentNodeProvider } from "src/editor/model/parser/documentNodeProvider";

export type Serializer<TNode extends ProseNode | ProseMark, TReturn extends void | string> = (state: IMarkdownSerializerState, node: TNode, parent: ProseNode, index: number) => TReturn;

/**
 * Options for configuring the serialization of a mark (inline formatting) in 
 * Markdown. 
 */
export interface IDocumentMarkSerializationOptions {

    serializeOpen: Serializer<ProseMark, string>;
    serializeClose: Serializer<ProseMark, string>;

    /**
     * Determines whether the mark can be mixed with other mixable marks.
     * 
     * When set to `true`, the mark's opening and closing syntax can be interleaved 
     * with other mixable marks. This allows for flexible ordering of marks, which 
     * is especially important in Markdown where certain marks like emphasis (`*`) 
     * and strong emphasis (`**`) can be combined in various ways.
     * 
     * **Example:**
     * 
     * In Markdown, you can nest emphasis and strong emphasis in different orders:
     * - `**This is **bold *and italic***` (bold containing italic)
     * - `*This is *italic **and bold***` (italic containing bold)
     * 
     * Setting `mixable` to `true` enables this flexibility.
     * @default true
     */
    readonly mixable?: boolean;

    /**
     * When enabled (`true`), causes the serializer to move any leading or trailing 
     * whitespace from inside the mark to outside the mark's syntax. 
     * 
     * **Use Case:**
     * In Markdown, emphasis marks (`*` or `_`) should not include leading or 
     * trailing whitespace. For example, `* hello *` is not valid
     * 
     * **Example:**
     * - Input Text Node: `"  hello  "` with an emphasis mark
     * - With `expelEnclosingWhitespace: true`, serialized as: `  *hello*  `
     * - Leading and trailing spaces are moved outside the emphasis marks.
     * 
     * **CommonMark Reference:**
     * - See [CommonMark Example 330](https://spec.commonmark.org/0.29/#example-330) for more details on why whitespace is expelled.
     * @default false
     */
    readonly expelEnclosingWhitespace?: boolean;

    /**
     * Specifies whether special characters inside the mark should be escaped.
     * 
     * When set to `false`, the serializer will not escape characters within the 
     * content of this mark.
     * 
     * **Important:**
     * - Marks with `escape: false` should have the highest precedence and must be the innermost marks.
     * - They cannot be nested within other marks that require escaping.
     * 
     * **Example:**
     * - For a code mark:
     *   - With `escape: false`, the content inside backticks is not escaped: `` `let x = 10;` ``
     *   - Special characters like `*`, `_`, or backslashes inside the code mark remain unescaped.
     * @default true
     */
    readonly escape?: boolean;
}

const defaultMarkSerializationOptions: IDocumentMarkSerializationOptions = {
    serializeOpen: () => '',
    serializeClose: () => '',
    mixable: true,
};

/**
 * An construction option for {@link MarkdownSerializer}.
 */
export interface IMarkdownSerializerOptions {
    readonly strict?: boolean;

    tightLists?: boolean;
    escapeExtraCharacters?: RegExp;
}

/**
 * Class for serializing ProseMirror documents to Markdown/CommonMark text.
 */
export class MarkdownSerializer {

    // [fields]

    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _options: IMarkdownSerializerOptions;

    // [constructor]

    constructor(
        nodeProvider: DocumentNodeProvider,
        options: IMarkdownSerializerOptions,
    ) {
        this._nodeProvider = nodeProvider;
        this._options = {
            tightLists: options.tightLists ?? false,
            strict: options.strict ?? true,
            escapeExtraCharacters: options.escapeExtraCharacters,
        };
    }

    /**
     * @description Serialize the content of the given node to Markdown.
     * @param content The ProseMirror document node.
     */
    public serialize(content: ProseNode): string {
        const state = new MarkdownSerializerState(this._nodeProvider, this._options);
        state.serializeBlock(content);
        const text = state.complete();
        return text;
    }
}

export interface IMarkdownSerializerState {

    readonly inTightList?: boolean;
    setInTightList(value: boolean | undefined): void;
    
    readonly inAutoLink?: boolean;
    setInAutoLink(value: boolean | undefined): void;

    complete(): string;
    serializeBlock(parent: ProseNode): void;
    serializeInline(parent: ProseNode, fromBlockStart?: boolean): void;
    write(content?: string): void;
    text(text: string, escape?: boolean): void;
    escaping(str: string, startOfLine?: boolean): string;
    wrapBlock(delim: string, firstDelim: string | null, node: ProseNode, f: () => void): void
    closeBlock(node: ProseNode): void;
}

/**
 * Class to manage Markdown serialization state and output generation.
 */
class MarkdownSerializerState implements IMarkdownSerializerState {

    // [fields]

    private readonly _nodeProvider: DocumentNodeProvider;
    private readonly _options: IMarkdownSerializerOptions;

    
    private _output: string = '';
    private _prevClosedNode?: ProseNode;
    private _delim: string = '';

    private _atBlockStart: boolean = false;
    private _inTightList?: boolean = false;
    private _inAutolink?: boolean = false;

    // [constructor]

    constructor(
        nodeProvider: DocumentNodeProvider,
        options: IMarkdownSerializerOptions,
    ) {
        this._nodeProvider = nodeProvider;
        this._options = options;
    }

    // [public methods]

    get inTightList(): boolean | undefined { return this._inTightList; }
    public setInTightList(value: boolean | undefined): void { this._inTightList = value; }
    get inAutolink(): boolean | undefined { return this._inAutolink; }
    public setInAutoLink(value: boolean | undefined): void { this._inAutolink = value; }

    public complete(): string {
        return this._output;
    }

    /**
     * @description Render the contents of a given node as block nodes.
     */
    public serializeBlock(parent: ProseNode): void {
        parent.forEach((node, _, index) => {
            this.__serializeBlock(node, parent, index);
        });
    }

    /**
     * @description Render the contents of `parent` as inline content
     */
    public serializeInline(parent: ProseNode, fromBlockStart: boolean = true): void {
        this._atBlockStart = fromBlockStart;
        const active: ProseMark[] = [];
        const trailing = ref('');

        parent.forEach((node, offset, index) => {
            this.__serializeInline(node, offset, index, parent, active, trailing);
        });
        this.__serializeInline(null, 0, parent.childCount, parent, active, trailing);
        this._atBlockStart = false;
    }

    /**
     * Prepare the state for writing output (closing closed paragraphs, adding 
     * delimiters, and so on), and then optionally add content (unescaped) to 
     * the output.
     */
    public write(content?: string): void {
        this.__flushClose();
        if (this._delim && this.__atBlank()) {
            this._output += this._delim;
        }
        if (content) {
            this._output += content;
        }
    }

    /**
     * Add the given text to the document. When escape is not `false`, t will be 
     * escaped.
     */
    public text(text: string, escape = true): void {
        const lines = text.split("\n");

        for (let i = 0; i < lines.length; i++) {
            this.write();

            // Escape exclamation marks in front of links
            if (!escape && lines[i]![0] === "[" && /(^|[^\\])!$/.test(this._output)) {
                this._output = this._output.slice(0, this._output.length - 1) + "\\!";
            }
            this._output += escape ? this.escaping(lines[i]!, this._atBlockStart) : lines[i];

            if (i !== lines.length - 1) {
                this._output += "\n";
            }
        }
    }

    /**
     * Escape the given string so that it can safely appear in Markdown
     * content. If `startOfLine` is true, also escape characters that
     * have special meaning only at the start of the line.
     */
    public escaping(str: string, startOfLine = false): string {
        str = str.replace(
            /[`*\\~[\]_]/g,
            (m, i) => m === "_" && i > 0 && i + 1 < str.length && str[i - 1]!.match(/\w/) && str[i + 1]!.match(/\w/) ? m : "\\" + m
        );

        if (startOfLine) {
            str = str.replace(/^(\+[ ]|[-*>])/, "\\$&").replace(/^(\s*)(#{1,6})(\s|$)/, '$1\\$2$3').replace(/^(\s*\d+)\.\s/, "$1\\. ");
        }

        if (this._options.escapeExtraCharacters) {
            str = str.replace(this._options.escapeExtraCharacters, "\\$&");
        }

        return str;
    }

    /**
     * Render a block, prefixing each line with `delim`, and the first
     * line in `firstDelim`. `node` should be the node that is closed at
     * the end of the block, and `f` is a function that renders the
     * content of the block.
     */
    public wrapBlock(delim: string, firstDelim: string | null, node: ProseNode, f: () => void): void {
        const old = this._delim;
        this.write(firstDelim !== null ? firstDelim : delim);
        this._delim += delim;
        f();
        this._delim = old;
        this.closeBlock(node);
    }

    public closeBlock(node: ProseNode): void {
        this._prevClosedNode = node;
    }

    // [private methods]

    /**
     * Render the contents of a given node as block nodes.
     */
    private __serializeBlock(node: ProseNode, parent: ProseNode, index: number): void {
        const nodeType = node.type;
        const nodeName = nodeType.name;
        const serializer = this._nodeProvider.getNode(nodeName);

        // success to find the node
        if (serializer) {
            serializer.serializer(this, node, parent, index);
            return;
        }

        // only log out the warning when strict mode is on and not omitting error
        if (this._options.strict === true) {
            panic(`Token type "${nodeName}" is not supported by the Markdown serializer (strict mode)`);
        }

        // strict mode is off, try to serialize it.
        if (nodeType.isLeaf) {
            return;
        }

        if (nodeType.inlineContent) {
            this.serializeInline(node, true);
        } else {
            this.serializeBlock(node);
        }

        if (node.isBlock) {
            this.closeBlock(node);
        }
    }

    private __serializeInline(node: ProseNode | null, offset: number, index: number, parent: ProseNode, active: ProseMark[], trailing: Ref<string>): void {
        let marks = node ? node.marks : [];

        /**
         * Adjusts the marks applied to a line break (`hard_break`) node to 
         * prevent unwanted marks from being retained when they shouldn't be. 
         * 
         * This ensures that marks such as bold, italic, etc., do not wrap over 
         * a line break when it's the last node in a parent or when the next 
         * node does not share the same marks.
         *
         * Specifically:
         * 1. If the current `node` is a line break and is the last child in its parent, all marks are removed.
         * 2. If the next sibling node shares the same marks, the marks are retained for continuity.
         * 3. If the next sibling node contains only whitespace or is not text, marks are also removed to avoid incorrect serialization.
         *
         * Example:
         * - Suppose we have this content: `**bold** <br> text`
         *   - If "bold" is the last content, the `<br>` should not inherit the `bold` mark.
         *   - If there's another node after the line break, and it shares the `bold` mark, the line break can retain it.
         */
        if (node && node.type.name === TokenEnum.LineBreak) {
            marks = marks.filter(m => {
                if (index + 1 === parent.childCount) {
                    return false;
                }
                const next = parent.child(index + 1);
                return m.isInSet(next.marks) && (!next.isText || /\S/.test(next.text!));
            });
        }

        /**
         * Adjusts the leading and trailing whitespace of the text node when a 
         * mark that expels enclosing whitespace is applied.
         * 
         * Example:
         * - Given a node with text `"   **bold** text"`, and the emphasis mark expels whitespace:
         *   - The leading spaces will be moved outside the bold formatting.
         *   - Output: `"   **bold** text"`
         */
        let leading = trailing.ref;
        trailing.ref = '';

        // leading handling
        const hasExpelMark = marks.some(mark => this.__getMarkOptions(mark.type.name).expelEnclosingWhitespace && !mark.isInSet(active));
        if (node && node.isText && hasExpelMark) {
            const [, lead, rest] = /^(\s*)(.*)$/m.exec(node.text!)!;
            if (lead) {
                leading += lead;
                node = rest ? (node as any).withText(rest) : null;
                if (!node) {
                    marks = active;
                }
            }
        }

        // trailing handling
        const hasExpelTrailingMark = marks.some(mark => this.__getMarkOptions(mark.type.name).expelEnclosingWhitespace && (index === parent.childCount - 1 || !mark.isInSet(parent.child(index + 1).marks)));
        if (node && node.isText && hasExpelTrailingMark) {
            const [, rest, trail] = /^(.*?)(\s*)$/m.exec(node.text!)!;
            if (trail) {
                trailing.ref = trail;
                node = rest ? (node as any).withText(rest) : null;
                if (!node) {
                    marks = active;
                }
            }
        }

        /**
         * Try to reorder 'mixable' marks, such as em and strong, which in 
         * Markdown may be opened and closed in different order, so that order 
         * of the marks for the token matches the order in active.
         */
        const inner = marks.length ? Arrays.last(marks) : null;
        const noEsc = inner && this.__getMarkOptions(inner.type.name).escape === false;
        const len = marks.length - (noEsc ? 1 : 0);
        outer: for (let i = 0; i < len; i++) {
            const mark = marks[i]!;
            if (!this.__getMarkOptions(mark.type.name).mixable) {
                break;
            }
            for (let j = 0; j < active.length; j++) {
                const other = active[j]!;
                if (!this.__getMarkOptions(other.type.name).mixable) {
                    break;
                }
                if (mark.eq(other)) {
                    if (i > j) {
                        marks = marks.slice(0, j).concat(mark).concat(marks.slice(j, i)).concat(marks.slice(i + 1, len));
                    } else if (j > i) {
                        marks = marks.slice(0, i).concat(marks.slice(i + 1, j)).concat(mark).concat(marks.slice(j, len));
                    }
                    continue outer;
                }
            }
        }

        // Find the prefix of the mark set that didn't change
        let keep = 0;
        while (keep < Math.min(active.length, len) && marks[keep]!.eq(active[keep]!)) {
            ++keep;
        }

        // Close the marks that need to be closed
        while (keep < active.length) {
            this.text(this.__serializeMark(active.pop()!, false, parent, index), false);
        }

        // Output any previously expelled trailing whitespace outside the marks
        if (leading) {
            this.text(leading);
        }

        // Open the marks that need to be opened
        if (node) {
            while (active.length < len) {
                const add = marks[active.length]!;
                active.push(add);
                this.text(this.__serializeMark(add, true, parent, index), false);
                this._atBlockStart = false;
            }

            // Render the node. Special case code marks, since their content
            // may not be escaped.
            if (noEsc && node.isText) {
                this.text(
                    this.__serializeMark(inner!, true, parent, index) +
                    node.text +
                    this.__serializeMark(inner!, false, parent, index + 1),
                    false
                );
            } else {
                this.__serializeBlock(node, parent, index);
            }
            this._atBlockStart = false;
        }

        // After the first non-empty text node is rendered, the end of output
        // is no longer at block start.
        if (node?.isText && node.nodeSize > 0) {
            this._atBlockStart = false;
        }
    }

    private __getMarkOptions(name: string): IDocumentMarkSerializationOptions {
        const markType = this._nodeProvider.getMark(name);
        if (markType) {
            return markType.serializer;
        }

        if (this._options.strict !== false) {
            panic(`Token type "${name}" is not supported by the Markdown serializer (strict mode)`);
        }

        return defaultMarkSerializationOptions;
    }

    private __atBlank(): boolean {
        return /(^|\n)$/.test(this._output);
    }

    private __flushClose(size: number = 1): void {
        if (this._prevClosedNode) {
            if (!this.__atBlank()) {
                this._output += "\n";
            }
            if (size > 1) {
                let delimMin = this._delim;
                const trim = /\s+$/.exec(delimMin);
                if (trim) {
                    delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
                }
                for (let i = 1; i < size; i++) {
                    this._output += delimMin + "\n";
                }
            }
            this._prevClosedNode = undefined;
        }
    }

    private __serializeMark(mark: ProseMark, open: boolean, parent: ProseNode, index: number): string {
        const markType = assert(this._nodeProvider.getMark(mark.type.name));
        const serializer = open ? markType.serializer.serializeOpen : markType.serializer.serializeClose;
        return serializer(this, mark, parent, index);
    }
}