import 'src/editor/model/documentNode/node/codeBlock/codeBlock.scss';
import { memoize } from "src/base/common/memoization";
import { Strings } from "src/base/common/utilities/string";
import { isString } from "src/base/common/utilities/type";
import { CodeEditorView, minimalSetup } from "src/editor/common/codeMirror";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { GetProseAttrs, ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";

export type CodeBlockAttrs = {
    /** @default '' */
    readonly lang?: string;
    readonly view?: CodeEditorView;
};

const enum CodeBlockFenceType {
    WaveLine = 'waveLine',
    backTick = 'backTick',
    Indent = 'indent',
}

// region - CodeBlock

/**
 * @class A code listing. Disallows marks or non-text inline nodes by default. 
 * Represented as a `<pre>` element with a `<code>` element inside of it.
 */
export class CodeBlock extends DocumentNode<EditorTokens.CodeBlock> {

    constructor(
        @IClipboardService private readonly clipboardService: IClipboardService,
    ) {
        super(TokenEnum.CodeBlock);
    }

    @memoize
    public getSchema(): ProseNodeSpec {
        return <ProseNodeSpec>{
            group: 'block',
            content: 'text*',
            marks: '', // disallow any marks
            code: true,
            defining: true,
            attrs: <GetProseAttrs<CodeBlockAttrs>>{
                view: { default: CodeBlock.createView('') },
                lang: { default: '' },
                fenceType: { default: CodeBlockFenceType.WaveLine },
                fenceLength: { default: 3 },
                hasEndFence: { default: true },
                hasSingleEndOfLine: { default: false },
                mismatchFence: { default: undefined },
            },
            toDOM: (node) => { 
                const { view, lang } = node.attrs;
                
                // the entire container of a code block
                const container = document.createElement('div');
                container.classList.add('code-block-container');

                const header = this.__createCodeBlockHeader(lang, view);
                container.appendChild(header);
                container.appendChild(view.dom);

                return container;
            },
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.CodeBlock>): void {
        const { token } = status;
        const fenceResult = __resolveFenceStatus(token);

        const attrs = {
            view: CodeBlock.createView(token.text),
            lang: token.lang,
            text: token.text,
            fenceType: fenceResult.type,
            fenceLength: fenceResult.length,
        };

        if (fenceResult.type !== CodeBlockFenceType.Indent) {
            attrs['hasEndFence'] = fenceResult.hasEndFence;
            attrs['hasSingleEndOfLine'] = fenceResult.hasSingleEndOfLine;
            attrs['mismatchFence'] = fenceResult.mismatchFence;
        }

        state.activateNode(this.ctor, status, { attrs: attrs });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const lang = node.attrs['lang'] as string;
        const view = node.attrs['view'] as CodeEditorView;
        const fenceType = node.attrs['fenceType'] as CodeBlockFenceType;
        const fenceLength = node.attrs['fenceLength'] as number;
        const hasEndFence = node.attrs['hasEndFence'] as boolean;
        const hasSingleEndOfLine = node.attrs['hasSingleEndOfLine'] as boolean;
        const mismatchFence = node.attrs['mismatchFence'] as string | undefined;
        
        // when the ending fence mismatched, it should be serialized as plain text.
        const textContent = 
            view.state.doc.toString() 
            + (isString(mismatchFence) ? mismatchFence : '');

        // indent type has no fences
        if (fenceType === CodeBlockFenceType.Indent) {
            const indent = '    ';
            state.setDefaultDelimiter(indent);
            state.text(textContent, false);
            state.setDefaultDelimiter('');
        } 
        // normal fence
        else {
            const fenceChar = fenceType === CodeBlockFenceType.WaveLine ? '~' : '`';
            const beginFence = fenceChar.repeat(fenceLength);
            state.write(beginFence + lang);

            if (textContent.length > 0) {
                state.text('\n');
                state.text(textContent, false);
            }

            if (hasEndFence) {
                state.write('\n');
                state.write(beginFence);
            }

            if (hasSingleEndOfLine) {
                state.text('\n', false);
            }
        }
        state.closeBlock(node);
    };

    public static createView(text: string): CodeEditorView {
        return new CodeEditorView({ 
            doc: text ?? '', 
            extensions: [minimalSetup],
        });
    }

    // region - [private]

    private __createCodeBlockHeader(lang: string, editorView: CodeEditorView): HTMLElement {
        const header = document.createElement('div');
        header.classList.add('code-block-header');
    
        const langLabel = document.createElement('span');
        langLabel.classList.add('code-lang');
        langLabel.textContent = lang || 'Unknown';
    
        const copyButton = document.createElement('button');
        copyButton.classList.add('code-copy');
        copyButton.textContent = '📋';
    
        copyButton.onclick = async () => {
            await this.clipboardService.write(ClipboardType.Text, editorView.state.doc.toString());
            copyButton.textContent = '✔️';
            setTimeout(() => (copyButton.textContent = '📋'), 2000);
        };
    
        header.appendChild(langLabel);
        header.appendChild(copyButton);
        return header;
    }
}


function __resolveFenceStatus(token: EditorTokens.CodeBlock): 
    { 
        type: CodeBlockFenceType.Indent, 
        length: undefined 
    } | { 
        type: CodeBlockFenceType.backTick | CodeBlockFenceType.WaveLine, 
        length: number, 
        hasEndFence: boolean, 
        hasSingleEndOfLine: boolean, 
        mismatchFence?: string 
    } 
{
    if (token.codeBlockStyle === 'indented') {
        return { type: CodeBlockFenceType.Indent, length: undefined };
    }

    const fenceRegex = /^(`{3,}|~{3,})[a-zA-Z0-9]*\s*$/gm;
    const match = token.raw.match(fenceRegex);

    // default
    if (!match) {
        return { type: CodeBlockFenceType.backTick, length: 3, hasEndFence: true, hasSingleEndOfLine: false };
    }

    const hasSingleEndOfLine = token.raw.at(-1) === '\n';
    const beginFenceMatch = match[0];
    const endFenceMatch = match[1];

    const beginFirstChar = beginFenceMatch.at(0)!;
    const fenceType = (beginFirstChar === '~') ? CodeBlockFenceType.WaveLine : CodeBlockFenceType.backTick;
    const beginFence = Strings.substringUntilNotChar(beginFenceMatch, beginFirstChar);

    if (!endFenceMatch) {
        return {
            type: fenceType,
            length: beginFence.length,
            hasEndFence: false,
            hasSingleEndOfLine: hasSingleEndOfLine,
        };
    }

    // has end fence, we check is they are the type and equal length
    const endFirstChar = endFenceMatch.at(0)!;
    const endFence = Strings.substringUntilNotChar(endFenceMatch, endFirstChar);

    // doesn't match the same fence type or length, indicates no end fence.
    if (beginFirstChar !== endFirstChar || beginFence.length !== endFence.length) {
        return {
            type: fenceType,
            length: beginFence.length,
            hasEndFence: false,
            hasSingleEndOfLine: hasSingleEndOfLine,
            mismatchFence: endFence,
        };
    }
    
    // fences match
    return {
        type: (beginFence.at(0) === '~') ? CodeBlockFenceType.WaveLine : CodeBlockFenceType.backTick,
        length: beginFence.length,
        hasEndFence: true,
        hasSingleEndOfLine: hasSingleEndOfLine,
    };
}