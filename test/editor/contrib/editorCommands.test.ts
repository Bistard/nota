import * as assert from 'assert';
import { ProseUtilsTest } from 'test/editor/view/editorHelpers';
import ist from 'ist';
import { ProseEditorState, ProseNode, ProseNodeSelection, ProseSchema, ProseSelection, ProseTextSelection } from 'src/editor/common/proseMirror';
import { EditorCommands } from 'src/editor/contrib/command/command.contrib';
import { nullObject } from 'test/utils/helpers';
import { EditorCommandBase } from 'src/editor/contrib/command/editorCommand';

const { doc, p, blockquote, hr, ul, li } = ProseUtilsTest.defaultNodes;
// import {schema, eq, doc, blockquote, pre, h1, p, li, ol, ul, em, strong, hr, img} from "prosemirror-test-builder";

function getFrom(node: ProseNode): number | undefined {
    return (node as any).tag['a'];
}

function getTo(node: ProseNode): number | undefined {
    return (node as any).tag['b'];
}

/**
 * Selection is marked by <a> and <b> during this test environment.
 */
function getSelection(doc: ProseNode): ProseSelection {
    const a = getFrom(doc);
    
    if (a !== undefined) {
        const $a = doc.resolve(a);
        if ($a.parent.inlineContent) {
            const b = getTo(doc);
            const $b = b !== undefined ? doc.resolve(b) : undefined;
            return new ProseTextSelection($a, $b);
        }

        else return new ProseNodeSelection($a);
    }

    return ProseSelection.atStart(doc);
}

function isEqualNode(a: ProseNode, b: ProseNode): boolean {
    return a.eq(b);
}

function createStateBy(doc: ProseNode) {
    return ProseEditorState.create({ doc, selection: getSelection(doc) });
}

function execCommand(doc: ProseNode, cmd: EditorCommandBase, result: ProseNode | null) {
    let state = createStateBy(doc);
    
    cmd.run(undefined!, undefined!, state, tr => state = state.apply(tr));
    ist(state.doc, result || doc, isEqualNode);
    
    if (result && getFrom(result) !== undefined) {
        ist(state.selection, getSelection(result), isEqualNode);
    }
}

suite.skip('editorCommands-test', () => {
    
    suite('DeleteSelection', () => {
        const cmd = new EditorCommands.DeleteSelection(nullObject());

        test('deletes part of a text node', () => {
            execCommand(
                doc(p('f<a>o<b>o')), cmd, 
                doc(p('fo')),
            );
        });

        test('can delete across blocks', () => {
            execCommand(
                doc(p('f<a>oo'), p('ba<b>r')), cmd, 
                doc(p('fr')),
            );
        });

        test('deletes node selections', () => {
            execCommand(
                doc(p('foo'), '<a>', hr()), cmd, 
                doc(p('foo')),
            );
        });

        test('moves selection after deleted node', () => {
            execCommand(
                doc(p('a'), '<a>', p('b'), blockquote(p('c'))), cmd,
                doc(p('a'), blockquote(p('<a>c')))
            );
        });

        test('moves selection before deleted node at end', () => {
            execCommand(
                doc(p('a'), '<a>', p('b')), cmd,
                doc(p('a<a>')),
            );
        });
    });

    suite('JoinBackward', () => {
        const cmd = new EditorCommands.JoinBackward(nullObject());
        
        test('can join paragraphs', () =>
            execCommand(
                doc(p('hi'), p('<a>there')), cmd, 
                doc(p('hithere'))),
        );

        test('can join out of a nested node', () => {
            execCommand(
                doc(p('hi'), blockquote(p('<a>there'))), cmd,
                doc(p('hi'), p('there')),
            );
        });

        test('moves a block into an adjacent wrapper', () => {
            execCommand(
                doc(blockquote(p('hi')), p('<a>there')), cmd,
                doc(blockquote(p('hi'), p('there'))),
            );
        });

        test('moves a block into an adjacent wrapper from another wrapper', () => {
            execCommand(
                doc(blockquote(p('hi')), blockquote(p('<a>there'))), cmd,
                doc(blockquote(p('hi'), p('there'))),
            );
        });

        test('joins the wrapper to a subsequent one if applicable', () => {
            execCommand(
                doc(blockquote(p('hi')), p('<a>there'), blockquote(p('x'))), cmd,
                doc(blockquote(p('hi'), p('there'), p('x'))),
            );
        });

        // FIX
        test('moves a block into a list item', () => {
            execCommand(
                doc(ul(li(p('hi'))), p('<a>there')), cmd,
                doc(ul(li(p('hi')), li(p('there')))),
            );
        });

        // FIX
        test('joins lists', () => {
            execCommand(
                doc(ul(li(p('hi'))), ul(li(p('<a>there')))), cmd,
                doc(ul(li(p('hi')), li(p('there')))),
            );
        });

        // FIX
        test('joins list items', () => {
            execCommand(
                doc(ul(li(p('hi')), li(p('<a>there')))), cmd,
                doc(ul(li(p('hi'), p('there')))),
            );
        });

        test('lifts out of a list at the start', () => {
            execCommand(
                doc(ul(li(p('<a>there')))), cmd, 
                doc(p('<a>there')),
            );
        });

        // FIX
        test('joins lists before and after', () => {
            execCommand(
                doc(ul(li(p('hi'))), p('<a>there'), ul(li(p('x')))), cmd,
                doc(ul(li(p('hi')), li(p('there')), li(p('x')))),
            );
        });

        test('deletes leaf nodes before', () => {
            execCommand(
                doc(hr, p('<a>there')), cmd, 
                doc(p('there')),
            );
        });

        test('lifts before it deletes', () => {
            execCommand(
                doc(hr, blockquote(p('<a>there'))), cmd, 
                doc(hr, p('there')),
            );
        });

        test('does nothing at start of doc', () => {
            execCommand(
                doc(p('<a>foo')), cmd, 
                null,
            );
        });

        test('can join single-textblock-child nodes', () => {
            const schema = new ProseSchema({
                nodes: {
                    text: { inline: true },
                    doc: { content: 'block+' },
                    block: { content: 'para' },
                    para: { content: 'text*' }
                }
            });
            const doc = schema
                .node('doc', null, [
                    schema.node('block', null, [schema.node('para', null, [schema.text('a')])]),
                    schema.node('block', null, [schema.node('para', null, [schema.text('b')])])
                ]);
            let state = ProseEditorState.create({ doc, selection: ProseTextSelection.near(doc.resolve(7)) });
            
            
            
            ist(cmd.run(undefined!, undefined!, state, tr => state = state.apply(tr)));
            ist(state.doc.toString(), 'doc(block(para("ab")))');
        });
    });
});