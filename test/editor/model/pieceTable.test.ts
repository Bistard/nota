import * as assert from 'assert';
import { Pair } from 'src/base/common/util/type';
import { EndOfLineType, IPieceTable, RBColor } from 'src/editor/common/model';
import { EditorPosition } from 'src/editor/common/position';
import { PieceTableTester } from 'src/editor/model/pieceTable';
import { TextBuffer, TextBufferBuilder } from 'src/editor/model/textBuffer';

class TestTextBufferBuilder extends TextBufferBuilder {
    constructor() {
        super();
    }

    public getChunks(): TextBuffer[] {
        return this._chunks;
    }
}

function buildPieceTable(values: string[], normalizationEOL?: boolean, defaultEOL?: EndOfLineType, force?: boolean): IPieceTable {
    const builder = new TestTextBufferBuilder();
    for (const value of values) {
        builder.receive(value);
    }
    builder.build();
    return builder.create(normalizationEOL, defaultEOL, force);
}

suite('PieceTable-test - content APIs', () => {
   
    test('content - no chunks', () => {
        let table = buildPieceTable([], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable([], true, EndOfLineType.CRLF);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable([], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
        PieceTableTester.assertPieceTable(table);
    });

    test('content - one chunk - unnormalized', () => {
        let table = buildPieceTable([''], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\r');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\r\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.deepStrictEqual(table.getRawContent(), '\r\nHello');
        PieceTableTester.assertPieceTable(table);
        
        table = buildPieceTable(['Hello'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        PieceTableTester.assertPieceTable(table);
        
        table = buildPieceTable(['Hello\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        PieceTableTester.assertPieceTable(table);
    });

    test('content - one chunk - normalized', () => {
        let table = buildPieceTable([''], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['\r\nHello'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.deepStrictEqual(table.getRawContent(), '\nHello');
        PieceTableTester.assertPieceTable(table);
        
        table = buildPieceTable(['Hello'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        PieceTableTester.assertPieceTable(table);
        
        table = buildPieceTable(['Hello\nWorld'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\nAgain'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');
        PieceTableTester.assertPieceTable(table);
    });

    test('content - mutiple chunks - unnormalized', () => {
        let table = buildPieceTable(['', ''], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.strictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);
        assert.strictEqual(table.getRawContent(), '\r\r');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.strictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.strictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['He', 'llo'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.strictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello' ,'\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\n');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\n');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['Hello', '\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);

    });

    test('content - mutiple chunks - normalized', () => {
        let table = buildPieceTable(['', ''], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.strictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);
        assert.strictEqual(table.getRawContent(), '\r\n\r\n');
        assert.strictEqual(table.getBufferLength(), 4);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.strictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r', '\nHello'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.strictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['He', 'llo'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.strictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello' ,'\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hel', 'lo\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['Hello', '\nWorld'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\n', 'World\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);


        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);
        PieceTableTester.assertPieceTable(table);

    });

    test('line - corner cases', () => {
        let table = buildPieceTable([], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getRawLine(0), '');
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);

        
        table = buildPieceTable([''], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getRawLine(0), '');
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r\n'], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getLine(1), '');
        assert.strictEqual(table.getRawLine(0), '\r\n');
        assert.strictEqual(table.getRawLine(1), '');
        assert.strictEqual(table.getLineCount(), 2);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['Hello there'], false);
        assert.strictEqual(table.getLine(0), 'Hello there');
        assert.strictEqual(table.getRawLine(0), 'Hello there');
        assert.strictEqual(table.getLineCount(), 1);
        PieceTableTester.assertPieceTable(table);


        table = buildPieceTable(['\r\n\r\n\r\n\n\n'], false);
        assert.strictEqual(table.getRawLine(0), '\r\n');
        assert.strictEqual(table.getRawLine(1), '\r\n');
        assert.strictEqual(table.getRawLine(2), '\r\n');
        assert.strictEqual(table.getRawLine(3), '\n');
        assert.strictEqual(table.getRawLine(4), '\n');
        assert.strictEqual(table.getRawLine(5), '');
        assert.strictEqual(table.getLineCount(), 6);
        PieceTableTester.assertPieceTable(table);

    });

    test('line - basic', () => {
        let table = buildPieceTable(['Hello\r\n', 'World.\nMy name is Chris\r\n', 'I started this project \r', 'when I was first year in university.'], false);
        assert.strictEqual(table.getLine(0), 'Hello');
        assert.strictEqual(table.getLine(1), 'World.');
        assert.strictEqual(table.getLine(2), 'My name is Chris');
        assert.strictEqual(table.getLine(3), 'I started this project ');
        assert.strictEqual(table.getLine(4), 'when I was first year in university.');
        assert.strictEqual(table.getRawLine(0), 'Hello\r\n');
        assert.strictEqual(table.getRawLine(1), 'World.\n');
        assert.strictEqual(table.getRawLine(2), 'My name is Chris\r\n');
        assert.strictEqual(table.getRawLine(3), 'I started this project \r');
        assert.strictEqual(table.getRawLine(4), 'when I was first year in university.');
        assert.strictEqual(table.getLineCount(), 5);
        PieceTableTester.assertPieceTable(table);

    });

    test('line - piece end with no linefeed', () => {
        let table = buildPieceTable(['Hello ', 'World.\nMy name is Chris\r\n', 'I started this project \n', 'when I was first year in university.\r\n'], false);
        assert.strictEqual(table.getLine(0), 'Hello World.');
        assert.strictEqual(table.getLine(1), 'My name is Chris');
        assert.strictEqual(table.getLine(2), 'I started this project ');
        assert.strictEqual(table.getLine(3), 'when I was first year in university.');
        assert.strictEqual(table.getLine(4), '');
        assert.strictEqual(table.getRawLine(0), 'Hello World.\n');
        assert.strictEqual(table.getRawLine(1), 'My name is Chris\r\n');
        assert.strictEqual(table.getRawLine(2), 'I started this project \n');
        assert.strictEqual(table.getRawLine(3), 'when I was first year in university.\r\n');
        assert.strictEqual(table.getRawLine(4), '');
        assert.strictEqual(table.getLineCount(), 5);
        PieceTableTester.assertPieceTable(table);

    });

    test('line - long text', () => {
        let surrogates = '😁';
        let table = buildPieceTable(['Hello ', 'World.\nMy name is Chris\r\n', 'I started this project \n', 'when I was first year in university.\r\nI wish whoever\r', ' read this line of code\r\n', 'take care of yourself' + surrogates.charAt(0), surrogates.charAt(1) + ' and have a \n', 'nice day!\n'], false);
        assert.strictEqual(table.getLine(0), 'Hello World.');
        assert.strictEqual(table.getLine(1), 'My name is Chris');
        assert.strictEqual(table.getLine(2), 'I started this project ');
        assert.strictEqual(table.getLine(3), 'when I was first year in university.');
        assert.strictEqual(table.getLine(4), 'I wish whoever');
        assert.strictEqual(table.getLine(5), ' read this line of code');
        assert.strictEqual(table.getLine(6), 'take care of yourself😁 and have a ');
        assert.strictEqual(table.getLine(7), 'nice day!');
        assert.strictEqual(table.getLine(8), '');
        assert.strictEqual(table.getRawLine(0), 'Hello World.\n');
        assert.strictEqual(table.getRawLine(1), 'My name is Chris\r\n');
        assert.strictEqual(table.getRawLine(2), 'I started this project \n');
        assert.strictEqual(table.getRawLine(3), 'when I was first year in university.\r\n');
        assert.strictEqual(table.getRawLine(4), 'I wish whoever\r');
        assert.strictEqual(table.getRawLine(5), ' read this line of code\r\n');
        assert.strictEqual(table.getRawLine(6), 'take care of yourself😁 and have a \n');
        assert.strictEqual(table.getRawLine(7), 'nice day!\n');
        assert.strictEqual(table.getRawLine(8), '');
        assert.strictEqual(table.getLineCount(), 9);
        PieceTableTester.assertPieceTable(table);

    });

    const offsetPositionCheck = function (table: IPieceTable, lineInfo: Pair<number, number>[]): void {

        let lineNumber = 0;
        for (lineNumber = 0; lineNumber < lineInfo.length; lineNumber++) {
            const [lineLength, rawLineLength] = lineInfo[lineNumber]!;
            assert.strictEqual(table.getLineLength(lineNumber), lineLength);
            assert.strictEqual(table.getRawLineLength(lineNumber), rawLineLength);
            for (let offset = 0; offset < rawLineLength; offset++) {
                const textOffset = table.getOffsetAt(lineNumber, offset);
                assert.deepStrictEqual(table.getPositionAt(textOffset), new EditorPosition(lineNumber, offset));
            }
        }
        assert.strictEqual(table.getLineCount(), lineInfo.length);

    }

    test('getOffsetAt / getPostionAt / getLineLength', () => {
        let surrogates = '😁';
        let table = buildPieceTable(['Hello ', 'World.\nMy name is Chris\r\n', 'I started this project \n', 'when I was first year in university.\r\nI wish whoever\r', ' read this line of code\r\n', 'take care of yourself' + surrogates.charAt(0), surrogates.charAt(1) + ' and have a \n', 'nice day!\n'], false);
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(0, 0)), new EditorPosition(0, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(1, 0)), new EditorPosition(1, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(1, 6)), new EditorPosition(1, 6));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(2, 0)), new EditorPosition(2, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(3, 0)), new EditorPosition(3, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(4, 0)), new EditorPosition(4, 0));
        PieceTableTester.assertPieceTable(table);

        table = buildPieceTable(
            [
                '123456\r\n7890\rqwer\ntyui',
                'op[]asd\n', 
                'fghj',
                'kl;',
                '\nzxcv\r\nbnm',
                '\n',
                '\r\n',
                '',
                '1111',
                '\r22',
                '333',
                '4444',
                '7777777'
            ]
        );
        offsetPositionCheck(table, [[6, 8], [4, 5], [4, 5], [11, 12], [7, 8], [4, 6], [3, 4], [0, 2], [4, 5], [16, 16]]);
        assert.deepStrictEqual(table.getPositionAt(1000), new EditorPosition(9, 15));
        PieceTableTester.assertPieceTable(table);
    });

    const getCharcodeCheck = function (table: IPieceTable, lines: string[]) {
        let offset = 0;
        for (let line of lines) {
            for (let i = 0; i < line.length; i++) {
                assert.notStrictEqual(table.getCharcodeAt(offset), line[i]);
                offset++;
            }
        }
    };

    test('getCharcodeAt', () => {
        const text = ['Hello\n', 'World\r\n', '', '\nasdqwe', 'as', '\n\n', '\r', 'asd', 'cc', '\n', 'a', '\r\n'];
        let table = buildPieceTable(text, false);
        getCharcodeCheck(table, text);
        PieceTableTester.assertPieceTable(table);

    });
    
});

suite('PieceTable-Test - insert / delete', () => {
   
    test('basic insert', () => {
		let table = buildPieceTable([
			'This is a document with some text.'
		]);

		table.insertAt(34, 'This is some more text to insert at offset 34.');
		assert.strictEqual(
			table.getRawContent(),
			'This is a document with some text.This is some more text to insert at offset 34.'
		);
	});

	test('more inserts', () => {
		let table = buildPieceTable(['']);

		table.insertAt(0, 'AAA');
		assert.strictEqual(table.getRawContent(), 'AAA');
		PieceTableTester.assertPieceTable(table);
        table.insertAt(0, 'BBB');
        assert.strictEqual(table.getRawContent(), 'BBBAAA');
		PieceTableTester.assertPieceTable(table);
        table.insertAt(6, 'CCC');
        assert.strictEqual(table.getRawContent(), 'BBBAAACCC');
		PieceTableTester.assertPieceTable(table);
        table.insertAt(5, 'DDD');
		assert.strictEqual(table.getRawContent(), 'BBBAADDDACCC');
		PieceTableTester.assertPieceTable(table);
	});

    test('random insert 1', () => {
		let str = '';
		let table = buildPieceTable(['']);
		table.insertAt(0, 'ceLPHmFzvCtFeHkCBej ');
		str = str.substring(0, 0) + 'ceLPHmFzvCtFeHkCBej ' + str.substring(0);
		assert.strictEqual(table.getRawContent(), str);
        table.insertAt(8, 'gDCEfNYiBUNkSwtvB K ');
		str = str.substring(0, 8) + 'gDCEfNYiBUNkSwtvB K ' + str.substring(8);
		assert.strictEqual(table.getRawContent(), str);
		table.insertAt(38, 'cyNcHxjNPPoehBJldLS ');
		str = str.substring(0, 38) + 'cyNcHxjNPPoehBJldLS ' + str.substring(38);
		assert.strictEqual(table.getRawContent(), str);
		table.insertAt(59, 'ejMx\nOTgWlbpeDExjOk ');
		str = str.substring(0, 59) + 'ejMx\nOTgWlbpeDExjOk ' + str.substring(59);
		assert.strictEqual(table.getRawContent(), str);
        PieceTableTester.assertPieceTable(table);
	});

    test('random insert 2', () => {
		let str = '';
		let table = buildPieceTable(['']);
		table.insertAt(0, 'VgPG ');
		str = str.substring(0, 0) + 'VgPG ' + str.substring(0);
		table.insertAt(2, 'DdWF ');
		str = str.substring(0, 2) + 'DdWF ' + str.substring(2);
		table.insertAt(0, 'hUJc ');
		str = str.substring(0, 0) + 'hUJc ' + str.substring(0);
		table.insertAt(8, 'lQEq ');
		str = str.substring(0, 8) + 'lQEq ' + str.substring(8);
		table.insertAt(10, 'Gbtp ');
		str = str.substring(0, 10) + 'Gbtp ' + str.substring(10);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random insert 3', () => {
		let str = '';
		let table = buildPieceTable(['']);
		table.insertAt(0, 'gYSz');
		str = str.substring(0, 0) + 'gYSz' + str.substring(0);
		assert.strictEqual(table.getRawContent(), str);
        table.insertAt(1, 'mDQe');
		str = str.substring(0, 1) + 'mDQe' + str.substring(1);
        assert.strictEqual(table.getRawContent(), str);
        table.insertAt(1, 'DTMQ');
		str = str.substring(0, 1) + 'DTMQ' + str.substring(1);
        assert.strictEqual(table.getRawContent(), str);
        table.insertAt(2, 'GGZB');
		str = str.substring(0, 2) + 'GGZB' + str.substring(2);
        assert.strictEqual(table.getRawContent(), str);
		table.insertAt(12, 'wXpq');
		str = str.substring(0, 12) + 'wXpq' + str.substring(12);
		assert.strictEqual(table.getRawContent(), str);
        PieceTableTester.assertPieceTable(table);
	});

});
