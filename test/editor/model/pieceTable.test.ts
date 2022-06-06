import * as assert from 'assert';
import { table } from 'console';
import { Pair } from 'src/base/common/util/type';
import { EndOfLine, EndOfLineType, IPieceTable } from 'src/editor/common/model';
import { EditorPosition } from 'src/editor/common/position';
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

suite('PieceTable-test', () => {
   
    test('content - no chunks', () => {
        let table = buildPieceTable([], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');

        table = buildPieceTable([], true, EndOfLineType.CRLF);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');

        table = buildPieceTable([], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');
    });

    test('content - one chunk - unnormalized', () => {
        let table = buildPieceTable([''], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');

        table = buildPieceTable(['\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\r');

        table = buildPieceTable(['\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');

        table = buildPieceTable(['\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\r\n');

        table = buildPieceTable(['\r\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.deepStrictEqual(table.getRawContent(), '\r\nHello');
        
        table = buildPieceTable(['Hello'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');

        table = buildPieceTable(['Hello\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');

        table = buildPieceTable(['Hello\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r');

        table = buildPieceTable(['Hello\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        
        table = buildPieceTable(['Hello\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');

        table = buildPieceTable(['Hello\nWorld\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');

        table = buildPieceTable(['Hello\nWorld\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');

        table = buildPieceTable(['Hello\nWorld\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
    });

    test('content - one chunk - normalized', () => {
        let table = buildPieceTable([''], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.deepStrictEqual(table.getRawContent(), '');

        table = buildPieceTable(['\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');

        table = buildPieceTable(['\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');

        table = buildPieceTable(['\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.deepStrictEqual(table.getRawContent(), '\n');

        table = buildPieceTable(['\r\nHello'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.deepStrictEqual(table.getRawContent(), '\nHello');
        
        table = buildPieceTable(['Hello'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');

        table = buildPieceTable(['Hello\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');

        table = buildPieceTable(['Hello\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');

        table = buildPieceTable(['Hello\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        
        table = buildPieceTable(['Hello\nWorld'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');

        table = buildPieceTable(['Hello\nWorld\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');

        table = buildPieceTable(['Hello\nWorld\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\n');

        table = buildPieceTable(['Hello\nWorld\r\nAgain'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain');

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');

        table = buildPieceTable(['Hello\nWorld\r\nAgain\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r\n'], true, EndOfLineType.LF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\nAgain\n');
    });

    test('content - mutiple chunks - unnormalized', () => {
        let table = buildPieceTable(['', ''], false);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.strictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);
        assert.strictEqual(table.getRawContent(), '\r\r');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.strictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['\r', '\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.strictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['He', 'llo'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.strictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['Hello' ,'\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\n');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\n');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['Hello', '\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);
    });

    test('content - mutiple chunks - normalized', () => {
        let table = buildPieceTable(['', ''], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['']);
        assert.strictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);
        assert.strictEqual(table.getRawContent(), '\r\n\r\n');
        assert.strictEqual(table.getBufferLength(), 4);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', '']);
        assert.strictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['\r', '\nHello'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        assert.strictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['He', 'llo'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello']);
        assert.strictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['Hello' ,'\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['Hello', '\nWorld'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);
        
        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        assert.strictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);
    });

    test('line - corner cases', () => {
        let table = buildPieceTable([], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getRawLine(0), '');
        assert.strictEqual(table.getLineCount(), 1);
        
        table = buildPieceTable([''], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getRawLine(0), '');
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r\n'], false);
        assert.strictEqual(table.getLine(0), '');
        assert.strictEqual(table.getLine(1), '');
        assert.strictEqual(table.getRawLine(0), '\r\n');
        assert.strictEqual(table.getRawLine(1), '');
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello there'], false);
        assert.strictEqual(table.getLine(0), 'Hello there');
        assert.strictEqual(table.getRawLine(0), 'Hello there');
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r\n\r\n\r\n\n\n'], false);
        assert.strictEqual(table.getRawLine(0), '\r\n');
        assert.strictEqual(table.getRawLine(1), '\r\n');
        assert.strictEqual(table.getRawLine(2), '\r\n');
        assert.strictEqual(table.getRawLine(3), '\n');
        assert.strictEqual(table.getRawLine(4), '\n');
        assert.strictEqual(table.getRawLine(5), '');
        assert.strictEqual(table.getLineCount(), 6);
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
    });

    const offsetPositionCheck = function (table: IPieceTable, lineInfo: number[]): void {

        let lineNumber = 0;
        for (lineNumber = 0; lineNumber < lineInfo.length; lineNumber++) {
            const lineLength = lineInfo[lineNumber]!;
            for (let offset = 0; offset < lineLength; offset++) {
                assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(lineNumber, offset)), new EditorPosition(lineNumber, offset));
            }
        }
        assert.strictEqual(table.getLineCount(), lineInfo.length);

    }

    test('getOffsetAt / getPostionAt', () => {
        let surrogates = '😁';
        let table = buildPieceTable(['Hello ', 'World.\nMy name is Chris\r\n', 'I started this project \n', 'when I was first year in university.\r\nI wish whoever\r', ' read this line of code\r\n', 'take care of yourself' + surrogates.charAt(0), surrogates.charAt(1) + ' and have a \n', 'nice day!\n'], false);
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(0, 0)), new EditorPosition(0, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(1, 0)), new EditorPosition(1, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(1, 6)), new EditorPosition(1, 6));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(2, 0)), new EditorPosition(2, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(3, 0)), new EditorPosition(3, 0));
        assert.deepStrictEqual(table.getPositionAt(table.getOffsetAt(4, 0)), new EditorPosition(4, 0));

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
        offsetPositionCheck(table, [8, 5, 5, 12, 7, 6, 4, 2, 5, 16]);
        assert.deepStrictEqual(table.getPositionAt(1000), new EditorPosition(9, 15));
    });
    
});
