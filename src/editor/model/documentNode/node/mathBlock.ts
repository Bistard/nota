import katex from "katex";
import { TokenizerAndRendererExtension } from "marked";
import { DomUtility } from "src/base/browser/basic/dom";
import { defer } from "src/base/common/utilities/async";
import { SmartRegExp } from "src/base/common/utilities/regExp";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { IMarkdownSerializerState } from "src/editor/model/serializer";
import { II18nService } from "src/platform/i18n/browser/i18nService";

export const mathBlockRule = 
    new SmartRegExp(/^dollarLine\n(contentLine)dollarLine/)
    .replace('dollarLine', /(?:dollars)\s*/)
    .replace('contentLine', /(?:singleLine\n)*/) // multiple line: allow to be empty
    .replace('singleLine', /(?!dollars)[^\n]*/) // single line: not allow occurrence of `$$`
    .replace('dollars', /\${2}/)
    .get();

export function createMathBlockTokenizer(): TokenizerAndRendererExtension {
    return {
        name: 'mathBlock',
        level: 'block',
        start: (src: string) => {
            return src.match(/^\${2}/m)?.index;
        },
        tokenizer: (src: string, tokens: any) => {
            const match = src.match(mathBlockRule);
            if (match) {
                return {
                    type: 'mathBlock',
                    raw: match[0],
                    text: match[1]!.trim(),
                };
            }
        },
    };
}

export class MathBlock extends DocumentNode<EditorTokens.MathBlock> {

    constructor(
        @II18nService private readonly i18nService: II18nService,
    ) {
        super(TokenEnum.MathBlock);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            draggable: true,
            selectable: true,
            attrs: {
                text: { default: '' },
            },
            toDOM: (node) => { 
                const text = node.attrs['text'] as string;
                const dom = document.createElement('div');
                dom.classList.add('math-block');
                this.__renderMath(text, dom);
                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.MathBlock>): void {
        const token = status.token;
        state.activateNode(this.ctor, status, {
            attrs: {
                text: token.text,
            }
        });
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { text } = node.attrs;
        state.write(`$$${text}$$`);
    };

    // [private helper methods]

    private __renderMath(text: string, dom: HTMLElement): void {
        
        // special case: empty math block
        if (text.trim().length === 0) {
            dom.classList.add('empty');
            const contentText = this.i18nService.localize('empty', 'Empty Math Block');
            dom.textContent = `< ${contentText} >`;
            return;
        }
        
        const guessIfTooLarge = text.length > 500;

        // render synchronously (blocking)
        if (!guessIfTooLarge) {
            this.__doRender(text, dom);
            return;
        }
        
        // render asynchronously (non-blocking)
        dom.classList.add('rendering');
        const contentText = this.i18nService.localize('rendering', 'Rendering...');
        dom.textContent = `< ${contentText} >`;
        defer(() => {
            if (dom && !DomUtility.Elements.ifInDomTree(dom)) {
                return;
            }
            
            dom.classList.remove('rendering');
            dom.textContent = '';

            this.__doRender(text, dom);
        });
    }

    private __doRender(text: string, dom: HTMLElement): void {
        // try rendering
        try {
            katex.render(text, dom, {
                displayMode: true,
                output: 'htmlAndMathml',
                throwOnError: true,
            });
        } 
        // error rendering
        catch (error) {
            dom.classList.add('render-error');
            const contentText = this.i18nService.localize('error', 'Error Equations');
            dom.textContent = contentText; 
        }
    }
}