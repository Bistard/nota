import * as assert from 'assert';
import { EndOfLine, EndOfLineType, IPieceTable } from 'src/editor/common/model';
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
   
    test('getContent - no chunks', () => {
        let table = buildPieceTable([], false);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable([], true, EndOfLineType.CRLF);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable([], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['']);
    });

    test('getContent - one chunk - unnormalized', () => {
        let table = buildPieceTable([''], false);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable(['\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        
        table = buildPieceTable(['Hello'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);

        table = buildPieceTable(['Hello\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        
        table = buildPieceTable(['Hello\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\nWorld\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
    });

    test('getContent - one chunk - normalized', () => {
        let table = buildPieceTable([''], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable(['\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r\nHello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        
        table = buildPieceTable(['Hello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello']);

        table = buildPieceTable(['Hello\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        
        table = buildPieceTable(['Hello\nWorld'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\nWorld\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', 'Again', '']);
    });

    test('getContent - mutiple chunks - unnormalized', () => {
        let table = buildPieceTable(['', ''], false);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable(['\r', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);

        table = buildPieceTable(['\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r', '\nHello'], false);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        
        table = buildPieceTable(['He', 'llo'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello']);

        table = buildPieceTable(['Hello' ,'\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        
        table = buildPieceTable(['Hello', '\nWorld'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello', '\n', 'World'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], false);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
    });

    test('getContent - mutiple chunks - normalized', () => {
        let table = buildPieceTable(['', ''], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['']);

        table = buildPieceTable(['\r', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', '', '']);

        table = buildPieceTable(['\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', '']);

        table = buildPieceTable(['\r', '\nHello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['', 'Hello']);
        
        table = buildPieceTable(['He', 'llo'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello']);

        table = buildPieceTable(['Hello' ,'\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);

        table = buildPieceTable(['Hello\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', '']);
        
        table = buildPieceTable(['Hello', '\nWorld'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello', '\n', 'World'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World', '']);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
        
        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getContent(), ['Hello', 'World😁', '']);
    });

    test('getRawContent - unnormalized', () => {
        let table = buildPieceTable(['', ''], false);
        assert.deepStrictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r', '\r'], false);
        assert.deepStrictEqual(table.getRawContent(), '\r\r');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['\r', '\n'], false);
        assert.deepStrictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['\r', '\nHello'], false);
        assert.deepStrictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['He', 'llo'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['Hello' ,'\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\n');

        table = buildPieceTable(['Hello', '\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r');
        assert.strictEqual(table.getBufferLength(), 6);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r');

        table = buildPieceTable(['Hel', 'lo\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello', '\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hello\r', '\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        
        table = buildPieceTable(['Hello', '\nWorld'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');
        assert.strictEqual(table.getBufferLength(), 11);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');

        table = buildPieceTable(['Hello', '\n', 'World'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld');

        table = buildPieceTable(['Hello\n', 'World\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r');

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 13);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld\r\n');

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], false);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 15);
        assert.strictEqual(table.getLineCount(), 3);
    });

    test('getRawContent - normalized', () => {
        let table = buildPieceTable(['', ''], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), '');
        assert.strictEqual(table.getBufferLength(), 0);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['\r', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), '\r\n\r\n');
        assert.strictEqual(table.getBufferLength(), 4);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), '\r\n');
        assert.strictEqual(table.getBufferLength(), 2);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['\r', '\nHello'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), '\r\nHello');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);
        
        table = buildPieceTable(['He', 'llo'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello');
        assert.strictEqual(table.getBufferLength(), 5);
        assert.strictEqual(table.getLineCount(), 1);

        table = buildPieceTable(['Hello' ,'\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        assert.strictEqual(table.getBufferLength(), 7);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hel', 'lo\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hello', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hel', 'lo\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hel', 'lo\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hello', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');

        table = buildPieceTable(['Hello\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\n');
        
        table = buildPieceTable(['Hello', '\nWorld'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld');
        assert.strictEqual(table.getBufferLength(), 12);
        assert.strictEqual(table.getLineCount(), 2);

        table = buildPieceTable(['Hello\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld');

        table = buildPieceTable(['Hello', '\n', 'World'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld');

        table = buildPieceTable(['Hello\n', 'World\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        assert.strictEqual(table.getBufferLength(), 14);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld\r\n');

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], true, EndOfLineType.CRLF, true);
        assert.deepStrictEqual(table.getRawContent(), 'Hello\r\nWorld😁\r\n');
        assert.strictEqual(table.getBufferLength(), 16);
        assert.strictEqual(table.getLineCount(), 3);
    });

});
