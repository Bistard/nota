import { assert } from "src/base/common/utilities/panic";
import { Strings, HtmlTagType } from "src/base/common/utilities/string";
import { Dictionary } from "src/base/common/utilities/type";
import { TokenEnum } from "src/editor/common/markdown";
import { EditorTokens } from "src/editor/common/model";
import { ProseNode, ProseNodeSpec } from "src/editor/common/proseMirror";
import { DocumentNode, IParseTokenStatus } from "src/editor/model/documentNode/documentNode";
import { IDocumentParseState } from "src/editor/model/parser";
import { createDomOutputFromOptions } from "src/editor/model/schema";
import { IMarkdownSerializerState } from "src/editor/model/serializer";

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
                text: { default: '' },
                isBlock: {},
            },
            toDOM: (node) => { 
                const text = node.attrs['text'] as string;
                const dom = document.createElement('div');
                dom.innerHTML = text;
                return dom;
            }
        };
    }

    public parseFromToken(state: IDocumentParseState, status: IParseTokenStatus<EditorTokens.HTML>): void {
        const { token } = status;
        let expectInlineHtmlTag: string | null = null;
        

        // block-level html
        if (token.block === true) {
            const tagName = '';
            expectInlineHtmlTag = tagName;

            state.activateNode(this.ctor, status, {
                attrs: {
                    text: token.text,
                    isBlock: token.block,
                    tagName: tagName,
                },
            });
            state.deactivateNode({ expectInlineHtmlTag });
            return;
        }
        
        // inline-level html
        
        const { type: tagType, tagName, attributes } = Strings.resolveHtmlTag(token.text);
        const htmlAttrs = {
            text: token.text,
            isBlock: token.block,
            tagType: tagType,
            tagName: tagName,
            attributes: attributes,
        };
        const inlineHTMLCtor = assert(state.getDocumentNode(TokenEnum.InlineHTML)).ctor;
        expectInlineHtmlTag = tagName ?? '';


        // self-closing tag: activate as a single node
        if (tagType === HtmlTagType.selfClosing) {
            state.activateNode(inlineHTMLCtor, status, { attrs: htmlAttrs });
            state.deactivateNode({ expectInlineHtmlTag });
        }
        // open tag: we activate an `inline_html` node.
        else if (tagType === HtmlTagType.open) {
            state.activateNode(inlineHTMLCtor, status, { attrs: htmlAttrs });
        } 
        // close tag: deactivate node (we are expecting to deactivate a `inline_html` node)
        else {
            state.deactivateNode({ expectInlineHtmlTag });
        }
    }

    public serializer = (state: IMarkdownSerializerState, node: ProseNode, parent: ProseNode, index: number) => {
        const { text } = node.attrs;
        state.write(text);
    };
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
                text: { default: '' },
                isBlock: {},
                tagType: { default: 'unknown' },
                tagName: { default: null },
                attributes: { default: null },
            },
            toDOM: (node) => { 
                const tagName = node.attrs['tagName'] as string;
                const tagType = node.attrs['tagType'] as HtmlTagType;
                const attributes = node.attrs['attributes'] as Dictionary<string, string> | null;

                return createDomOutputFromOptions({
                    type: 'node',
                    tagName: tagName,
                    editable: true,
                    attributes: attributes ?? {}
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

    public serializer = (state: IMarkdownSerializerState, node: ProseNode): void => {
        const tagName = node.attrs['tagName'] as string;
        const tagType = node.attrs['tagType'] as HtmlTagType;
        const attributes = node.attrs['attributes'] as Dictionary<string, string> | null;

        // starting
        if (tagType === HtmlTagType.open || tagType === HtmlTagType.selfClosing) {
            let tagString = `<${tagName}`;
            
            if (attributes) {
                for (const [attrName, attrValue] of Object.entries(attributes)) {
                    tagString += ` ${attrName}="${attrValue}"`;
                }
            }

            if (tagType === HtmlTagType.selfClosing) {
                tagString += '/>';
            } else {
                tagString += '>';
            }

            state.text(tagString, false);
        }

        // closing
        if (tagType === HtmlTagType.open) {
            state.serializeInline(node);
            state.text(`</${tagName}>`, false);
        }
    };
}