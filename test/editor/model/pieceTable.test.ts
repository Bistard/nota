import * as assert from 'assert';
import { Pair } from 'src/base/common/util/type';
import { EndOfLineType, IPieceTable } from 'src/editor/common/model';
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

suite('PieceTable-test - insert / delete', () => {
   
    test('basic insert / delete', () => {
		let table = buildPieceTable([
			'This is a document with some text.'
		]);

		table.insertAt(34, 'This is some more text to insert at offset 34.');
		assert.strictEqual(
			table.getRawContent(),
			'This is a document with some text.This is some more text to insert at offset 34.'
		);

        table.deleteAt(42, 5);
		assert.strictEqual(
			table.getRawContent(),
			'This is a document with some text.This is more text to insert at offset 34.'
		);

        PieceTableTester.assertPieceTable(table);
	});

	test('more inserts', () => {
		let table = buildPieceTable(['']);

		table.insertAt(0, 'AAA');
		assert.strictEqual(table.getRawContent(), 'AAA');
        table.insertAt(0, 'BBB');
        assert.strictEqual(table.getRawContent(), 'BBBAAA');
        table.insertAt(6, 'CCC');
        assert.strictEqual(table.getRawContent(), 'BBBAAACCC');
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

    test('more deletes', () => {
		let table = buildPieceTable(['012345678']);
		table.deleteAt(8, 1);
		assert.strictEqual(table.getRawContent(), '01234567');
		table.deleteAt(0, 1);
		assert.strictEqual(table.getRawContent(), '1234567');
        table.deleteAt(5, 1);
		assert.strictEqual(table.getRawContent(), '123457');
        table.deleteAt(5, 1);
		assert.strictEqual(table.getRawContent(), '12345');
		table.deleteAt(0, 5);
		assert.strictEqual(table.getRawContent(), '');
		PieceTableTester.assertPieceTable(table);
	});

    test('random delete 1', () => {
		let str = '';
		let table = buildPieceTable(['']);

		table.insertAt(0, 'vfb');
		str = str.substring(0, 0) + 'vfb' + str.substring(0);
		assert.strictEqual(table.getRawContent(), str);
		table.insertAt(0, 'zRq');
		str = str.substring(0, 0) + 'zRq' + str.substring(0);
		assert.strictEqual(table.getRawContent(), str);

		table.deleteAt(5, 1);
		str = str.substring(0, 5) + str.substring(5 + 1);
		assert.strictEqual(table.getRawContent(), str);

		table.insertAt(1, 'UNw');
		str = str.substring(0, 1) + 'UNw' + str.substring(1);
		assert.strictEqual(table.getRawContent(), str);

		table.deleteAt(4, 3);
		str = str.substring(0, 4) + str.substring(4 + 3);
		assert.strictEqual(table.getRawContent(), str);

		table.deleteAt(1, 4);
		str = str.substring(0, 1) + str.substring(1 + 4);
		assert.strictEqual(table.getRawContent(), str);

		table.deleteAt(0, 1);
		str = str.substring(0, 0) + str.substring(0 + 1);
		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random delete 2', () => {
		let str = '';
		let table = buildPieceTable(['']);

		table.insertAt(0, 'IDT');
		str = str.substring(0, 0) + 'IDT' + str.substring(0);
		table.insertAt(3, 'wwA');
		str = str.substring(0, 3) + 'wwA' + str.substring(3);
		table.insertAt(3, 'Gnr');
		str = str.substring(0, 3) + 'Gnr' + str.substring(3);
		table.deleteAt(6, 3);
		str = str.substring(0, 6) + str.substring(6 + 3);
		table.insertAt(4, 'eHp');
		str = str.substring(0, 4) + 'eHp' + str.substring(4);
		table.insertAt(1, 'UAi');
		str = str.substring(0, 1) + 'UAi' + str.substring(1);
		table.insertAt(2, 'FrR');
		str = str.substring(0, 2) + 'FrR' + str.substring(2);
		table.deleteAt(6, 7);
		str = str.substring(0, 6) + str.substring(6 + 7);
		table.deleteAt(3, 5);
		str = str.substring(0, 3) + str.substring(3 + 5);
		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random delete 3', () => {
		let str = '';
		let table = buildPieceTable(['']);
		table.insertAt(0, 'PqM');
		str = str.substring(0, 0) + 'PqM' + str.substring(0);
		table.deleteAt(1, 2);
		str = str.substring(0, 1) + str.substring(1 + 2);
		table.insertAt(1, 'zLc');
		str = str.substring(0, 1) + 'zLc' + str.substring(1);
		table.insertAt(0, 'MEX');
		str = str.substring(0, 0) + 'MEX' + str.substring(0);
		table.insertAt(0, 'jZh');
		str = str.substring(0, 0) + 'jZh' + str.substring(0);
		table.insertAt(8, 'GwQ');
		str = str.substring(0, 8) + 'GwQ' + str.substring(8);
		table.deleteAt(5, 6);
		str = str.substring(0, 5) + str.substring(5 + 6);
		table.insertAt(4, 'ktw');
		str = str.substring(0, 4) + 'ktw' + str.substring(4);
		table.insertAt(5, 'GVu');
		str = str.substring(0, 5) + 'GVu' + str.substring(5);
		table.insertAt(9, 'jdm');
		str = str.substring(0, 9) + 'jdm' + str.substring(9);
		table.insertAt(15, 'na\n');
		str = str.substring(0, 15) + 'na\n' + str.substring(15);
		table.deleteAt(5, 8);
		str = str.substring(0, 5) + str.substring(5 + 8);
		table.deleteAt(3, 4);
		str = str.substring(0, 3) + str.substring(3 + 4);
		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

    test('random insert/delete \\r bug 1', () => {
		let str = 'a';
		let table = buildPieceTable(['a']);
		table.deleteAt(0, 1);
		str = str.substring(0, 0) + str.substring(0 + 1);
		table.insertAt(0, '\r\r\n\n');
		str = str.substring(0, 0) + '\r\r\n\n' + str.substring(0);
		table.deleteAt(3, 1);
		str = str.substring(0, 3) + str.substring(3 + 1);
		table.insertAt(2, '\n\n\ra');
		str = str.substring(0, 2) + '\n\n\ra' + str.substring(2);
		table.deleteAt(4, 3);
		str = str.substring(0, 4) + str.substring(4 + 3);
		table.insertAt(2, '\na\r\r');
		str = str.substring(0, 2) + '\na\r\r' + str.substring(2);
		table.insertAt(6, '\ra\n\n');
		str = str.substring(0, 6) + '\ra\n\n' + str.substring(6);
		table.insertAt(0, 'aa\n\n');
		str = str.substring(0, 0) + 'aa\n\n' + str.substring(0);
		table.insertAt(5, '\n\na\r');
		str = str.substring(0, 5) + '\n\na\r' + str.substring(5);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random insert/delete \\r bug 2', () => {
		let str = 'a';
		let table = buildPieceTable(['a']);
		table.insertAt(1, '\naa\r');
		str = str.substring(0, 1) + '\naa\r' + str.substring(1);
		table.deleteAt(0, 4);
		str = str.substring(0, 0) + str.substring(0 + 4);
		table.insertAt(1, '\r\r\na');
		str = str.substring(0, 1) + '\r\r\na' + str.substring(1);
		table.insertAt(2, '\n\r\ra');
		str = str.substring(0, 2) + '\n\r\ra' + str.substring(2);
		table.deleteAt(4, 1);
		str = str.substring(0, 4) + str.substring(4 + 1);
		table.insertAt(8, '\r\n\r\r');
		str = str.substring(0, 8) + '\r\n\r\r' + str.substring(8);
		table.insertAt(7, '\n\n\na');
		str = str.substring(0, 7) + '\n\n\na' + str.substring(7);
		table.insertAt(13, 'a\n\na');
		str = str.substring(0, 13) + 'a\n\na' + str.substring(13);
		table.deleteAt(17, 3);
		str = str.substring(0, 17) + str.substring(17 + 3);
		table.insertAt(2, 'a\ra\n');
		str = str.substring(0, 2) + 'a\ra\n' + str.substring(2);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random insert/delete \\r bug 3', () => {
		let str = 'a';
		let table = buildPieceTable(['a']);
		table.insertAt(0, '\r\na\r');
		str = str.substring(0, 0) + '\r\na\r' + str.substring(0);
		table.deleteAt(2, 3);
		str = str.substring(0, 2) + str.substring(2 + 3);
		table.insertAt(2, 'a\r\n\r');
		str = str.substring(0, 2) + 'a\r\n\r' + str.substring(2);
		table.deleteAt(4, 2);
		str = str.substring(0, 4) + str.substring(4 + 2);
		table.insertAt(4, 'a\n\r\n');
		str = str.substring(0, 4) + 'a\n\r\n' + str.substring(4);
		table.insertAt(1, 'aa\n\r');
		str = str.substring(0, 1) + 'aa\n\r' + str.substring(1);
		table.insertAt(7, '\na\r\n');
		str = str.substring(0, 7) + '\na\r\n' + str.substring(7);
		table.insertAt(5, '\n\na\r');
		str = str.substring(0, 5) + '\n\na\r' + str.substring(5);
		table.insertAt(10, '\r\r\n\r');
		str = str.substring(0, 10) + '\r\r\n\r' + str.substring(10);
		assert.strictEqual(table.getRawContent(), str);
		table.deleteAt(21, 3);
		str = str.substring(0, 21) + str.substring(21 + 3);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random insert/delete \\r bug 4', () => {
		let str = 'a';
		let table = buildPieceTable(['a']);
		table.deleteAt(0, 1);
		str = str.substring(0, 0) + str.substring(0 + 1);
		table.insertAt(0, '\naaa');
		str = str.substring(0, 0) + '\naaa' + str.substring(0);
		table.insertAt(2, '\n\naa');
		str = str.substring(0, 2) + '\n\naa' + str.substring(2);
		table.deleteAt(1, 4);
		str = str.substring(0, 1) + str.substring(1 + 4);
		table.deleteAt(3, 1);
		str = str.substring(0, 3) + str.substring(3 + 1);
		table.deleteAt(1, 2);
		str = str.substring(0, 1) + str.substring(1 + 2);
		table.deleteAt(0, 1);
		str = str.substring(0, 0) + str.substring(0 + 1);
		table.insertAt(0, 'a\n\n\r');
		str = str.substring(0, 0) + 'a\n\n\r' + str.substring(0);
		table.insertAt(2, 'aa\r\n');
		str = str.substring(0, 2) + 'aa\r\n' + str.substring(2);
		table.insertAt(3, 'a\naa');
		str = str.substring(0, 3) + 'a\naa' + str.substring(3);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

	test('random insert/delete \\r bug 5', () => {
		let str = '';
		let table = buildPieceTable(['']);
		table.insertAt(0, '\n\n\n\r');
		str = str.substring(0, 0) + '\n\n\n\r' + str.substring(0);
		table.insertAt(1, '\n\n\n\r');
		str = str.substring(0, 1) + '\n\n\n\r' + str.substring(1);
		table.insertAt(2, '\n\r\r\r');
		str = str.substring(0, 2) + '\n\r\r\r' + str.substring(2);
		table.insertAt(8, '\n\r\n\r');
		str = str.substring(0, 8) + '\n\r\n\r' + str.substring(8);
		table.deleteAt(5, 2);
		str = str.substring(0, 5) + str.substring(5 + 2);
		table.insertAt(4, '\n\r\r\r');
		str = str.substring(0, 4) + '\n\r\r\r' + str.substring(4);
		table.insertAt(8, '\n\n\n\r');
		str = str.substring(0, 8) + '\n\n\n\r' + str.substring(8);
		table.deleteAt(0, 7);
		str = str.substring(0, 0) + str.substring(0 + 7);
		table.insertAt(1, '\r\n\r\r');
		str = str.substring(0, 1) + '\r\n\r\r' + str.substring(1);
		table.insertAt(15, '\n\r\r\r');
		str = str.substring(0, 15) + '\n\r\r\r' + str.substring(15);

		assert.strictEqual(table.getRawContent(), str);
		PieceTableTester.assertPieceTable(table);
	});

});

suite('PieceTable-test - CRLF', () => {

    test('delete CR in CRLF 1', () => {
		let table = buildPieceTable([''], false);
		table.insertAt(0, 'a\r\nb');
		table.deleteAt(0, 2);

		assert.strictEqual(table.getLineCount(), 2);
		PieceTableTester.assertPieceTable(table);
	});

	test('delete CR in CRLF 2', () => {
		let table = buildPieceTable([''], false);
		table.insertAt(0, 'a\r\nb');
		table.deleteAt(2, 2);

		assert.strictEqual(table.getLineCount(), 2);
		PieceTableTester.assertPieceTable(table);
	});

	test('random bug 1', () => {
		let str = '';
		let table = buildPieceTable([''], false);
		table.insertAt(0, '\n\n\r\r');
		str = str.substring(0, 0) + '\n\n\r\r' + str.substring(0);
		table.insertAt(1, '\r\n\r\n');
		str = str.substring(0, 1) + '\r\n\r\n' + str.substring(1);
		table.deleteAt(5, 3);
		str = str.substring(0, 5) + str.substring(5 + 3);
		table.deleteAt(2, 3);
		str = str.substring(0, 2) + str.substring(2 + 3);

		let lines = str.split(/\r\n|\r|\n/);
		assert.strictEqual(table.getLineCount(), lines.length);
		PieceTableTester.assertPieceTable(table);
	});
	test('random bug 2', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\r\n\r');
		str = str.substring(0, 0) + '\n\r\n\r' + str.substring(0);
		table.insertAt(2, '\n\r\r\r');
		str = str.substring(0, 2) + '\n\r\r\r' + str.substring(2);
		table.deleteAt(4, 1);
		str = str.substring(0, 4) + str.substring(4 + 1);

		let lines = str.split(/\r\n|\r|\n/);
		assert.strictEqual(table.getLineCount(), lines.length);
		PieceTableTester.assertPieceTable(table);
	});
	test('random bug 3', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\n\n\r');
		str = str.substring(0, 0) + '\n\n\n\r' + str.substring(0);
		table.deleteAt(2, 2);
		str = str.substring(0, 2) + str.substring(2 + 2);
		table.deleteAt(0, 2);
		str = str.substring(0, 0) + str.substring(0 + 2);
		table.insertAt(0, '\r\r\r\r');
		str = str.substring(0, 0) + '\r\r\r\r' + str.substring(0);
		table.insertAt(2, '\r\n\r\r');
		str = str.substring(0, 2) + '\r\n\r\r' + str.substring(2);
		table.insertAt(3, '\r\r\r\n');
		str = str.substring(0, 3) + '\r\r\r\n' + str.substring(3);

		let lines = str.split(/\r\n|\r|\n/);
		assert.strictEqual(table.getLineCount(), lines.length);
		PieceTableTester.assertPieceTable(table);
	});

    const testLinesContent = function (str: string, table: IPieceTable) {
        let lines = str.split(/\r\n|\r|\n/);
        assert.strictEqual(table.getLineCount(), lines.length);
        assert.strictEqual(table.getRawContent(), str);
        for (let i = 0; i < lines.length; i++) {
            assert.strictEqual(table.getLine(i + 1), lines[i]);
        }
    }

	test('random bug 4', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\n\n\n');
        str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
        table.deleteAt(3, 1);
		str = str.substring(0, 3) + str.substring(3 + 1);
		table.insertAt(1, '\r\r\r\r');
		str = str.substring(0, 1) + '\r\r\r\r' + str.substring(1);
		table.insertAt(6, '\r\n\n\r');
		str = str.substring(0, 6) + '\r\n\n\r' + str.substring(6);
		table.deleteAt(5, 3);
		str = str.substring(0, 5) + str.substring(5 + 3);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});
	test('random bug 5', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\n\n\n');
		str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
		table.deleteAt(3, 1);
		str = str.substring(0, 3) + str.substring(3 + 1);
		table.insertAt(0, '\n\r\r\n');
		str = str.substring(0, 0) + '\n\r\r\n' + str.substring(0);
		table.insertAt(4, '\n\r\r\n');
		str = str.substring(0, 4) + '\n\r\r\n' + str.substring(4);
		table.deleteAt(4, 3);
		str = str.substring(0, 4) + str.substring(4 + 3);
		table.insertAt(5, '\r\r\n\r');
		str = str.substring(0, 5) + '\r\r\n\r' + str.substring(5);
		table.insertAt(12, '\n\n\n\r');
		str = str.substring(0, 12) + '\n\n\n\r' + str.substring(12);
		table.insertAt(5, '\r\r\r\n');
		str = str.substring(0, 5) + '\r\r\r\n' + str.substring(5);
		table.insertAt(20, '\n\n\r\n');
		str = str.substring(0, 20) + '\n\n\r\n' + str.substring(20);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});
	test('random bug 6', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\r\r\n');
		str = str.substring(0, 0) + '\n\r\r\n' + str.substring(0);
		table.insertAt(4, '\r\n\n\r');
		str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
		table.insertAt(3, '\r\n\n\n');
		str = str.substring(0, 3) + '\r\n\n\n' + str.substring(3);
		table.deleteAt(4, 8);
		str = str.substring(0, 4) + str.substring(4 + 8);
		table.insertAt(4, '\r\n\n\r');
		str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
		table.insertAt(0, '\r\n\n\r');
		str = str.substring(0, 0) + '\r\n\n\r' + str.substring(0);
		table.deleteAt(4, 0);
		str = str.substring(0, 4) + str.substring(4 + 0);
		table.deleteAt(8, 4);
		str = str.substring(0, 8) + str.substring(8 + 4);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});
	
	test('random bug 7', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\r\r\n\n');
		str = str.substring(0, 0) + '\r\r\n\n' + str.substring(0);
		table.insertAt(4, '\r\n\n\r');
		str = str.substring(0, 4) + '\r\n\n\r' + str.substring(4);
		table.insertAt(7, '\n\r\r\r');
		str = str.substring(0, 7) + '\n\r\r\r' + str.substring(7);
		table.insertAt(11, '\n\n\r\n');
		str = str.substring(0, 11) + '\n\n\r\n' + str.substring(11);
		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});

    test('random bug 8', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\r\n\n\r');
		str = str.substring(0, 0) + '\r\n\n\r' + str.substring(0);
		table.deleteAt(1, 0);
		str = str.substring(0, 1) + str.substring(1 + 0);
		table.insertAt(3, '\n\n\n\r');
		str = str.substring(0, 3) + '\n\n\n\r' + str.substring(3);
		table.insertAt(7, '\n\n\r\n');
		str = str.substring(0, 7) + '\n\n\r\n' + str.substring(7);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});

	test('random bug 9', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, 'qneW');
		str = str.substring(0, 0) + 'qneW' + str.substring(0);
		table.insertAt(0, 'YhIl');
		str = str.substring(0, 0) + 'YhIl' + str.substring(0);
		table.insertAt(0, 'qdsm');
		str = str.substring(0, 0) + 'qdsm' + str.substring(0);
		table.deleteAt(7, 0);
		str = str.substring(0, 7) + str.substring(7 + 0);
		table.insertAt(12, 'iiPv');
		str = str.substring(0, 12) + 'iiPv' + str.substring(12);
		table.insertAt(9, 'V\rSA');
		str = str.substring(0, 9) + 'V\rSA' + str.substring(9);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});

	test('random bug 10', () => {
		let str = '';
		let table = buildPieceTable([''], false);

		table.insertAt(0, '\n\n\n\n');
		str = str.substring(0, 0) + '\n\n\n\n' + str.substring(0);
		table.insertAt(3, '\n\r\n\r');
		str = str.substring(0, 3) + '\n\r\n\r' + str.substring(3);
		table.insertAt(2, '\n\r\n\n');
		str = str.substring(0, 2) + '\n\r\n\n' + str.substring(2);
		table.insertAt(0, '\n\n\r\r');
		str = str.substring(0, 0) + '\n\n\r\r' + str.substring(0);
		table.insertAt(3, '\r\r\r\r');
		str = str.substring(0, 3) + '\r\r\r\r' + str.substring(3);
		table.insertAt(3, '\n\n\r\r');
		str = str.substring(0, 3) + '\n\n\r\r' + str.substring(3);

		testLinesContent(str, table);
		PieceTableTester.assertPieceTable(table);
	});

});