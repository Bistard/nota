import { Tokens } from "marked";
import { assert } from "src/base/common/utilities/panic";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorToken, EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode } from "src/editor/model/parser/documentNode";
import { IDocumentParseState } from "src/editor/model/parser/parser";
import { createDomOutputFromOptions } from "src/editor/model/schema";
import { IMarkdownSerializerState } from "src/editor/model/serializer/serializer";

/**
 * @class A block node that represents `<html>`.
 */
export class HTML extends DocumentNode<EditorTokens.HTML> {

    constructor() {
        super(TokenEnum.HTML);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'block',
            content: undefined,
            attrs: {
                text: {}, // string
                tagName: {}, // string
            },
            parseDOM: [ { tag: 'html', } ],
            toDOM: (node) => { 
                const text = node.attrs['text'] as string;

                // block rendering
                const dom = document.createElement('div');
                dom.innerHTML = text;
                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, token: EditorTokens.HTML): void {
        const tagName = __getTagName(token.text);
        const htmlAttrs = {
            text: token.text,
            isBlock: token.block,
            tagName: tagName,
        };
        
        // block-level html
        if (token.block === true) {
            state.activateNode(this.ctor, htmlAttrs);
            state.deactivateNode();
            return;
        }

        // open tag: we activate a node and stop.
        if (__isOpenTag(token.text)) {
            const inlineHTMLCtor = assert(state.getDocumentNode(TokenEnum.InlineHTML)).ctor;
            state.activateNode(inlineHTMLCtor, htmlAttrs);
            return;
        }

        // close tag: deactivate node
        state.deactivateNode();
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { text } = node.attrs;
        state.write(text);
    };
}

function __getTagName(rawTag: string): string | null {
    const match = rawTag.match(/^<\/?(\w+)/);
    return match ? match[1]! : null;
}


function __isOpenTag(rawTag: string): boolean {
    return !rawTag.startsWith('</');
}

export class InlineHTML extends DocumentNode<EditorTokens.InlineHTML> {
    
    constructor() {
        super(TokenEnum.InlineHTML);
    }

    public getSchema(): ProseNodeSpec {
        return {
            group: 'inline',
            inline: true,
            content: 'inline*',
            attrs: {
                text: {}, // string
                tagName: {}, // string
            },
            toDOM: (node) => { 
                const tagName = node.attrs['tagName'] as string;

                // inline rendering
                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: tagName,
                    editable: true,
                });
            }
        };
    }

    public override parseFromToken(): void {
        /**
         * Since {@link InlineHTML} has no corresponding tokens from the `marked`. 
         * It is created by {@link HTML}, thus this api should do nothing.
         */
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode) => {
        const tagName = node.attrs['tagName'] as string;
        
        state.text(`<${tagName}>`, false);
        state.serializeInline(node);
        state.text(`</${tagName}>`, false);
    };
}