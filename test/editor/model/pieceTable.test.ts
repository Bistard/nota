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

function buildPieceTable(values: string[], normalizationEOL?: boolean, defaultEOL?: EndOfLineType): IPieceTable {
    const builder = new TestTextBufferBuilder();
    for (const value of values) {
        builder.receive(value);
    }
    builder.build();
    return builder.create(normalizationEOL, defaultEOL);
}

suite('PieceTable-test', () => {
   
    test('getLines - no chunks', () => {
        let table = buildPieceTable([], false);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable([], true, EndOfLineType.CRLF);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable([], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['']);
    });

    test('getLines - one chunk - unnormalized', () => {
        let table = buildPieceTable([''], false);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable(['\r'], false);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\n'], false);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r\nHello'], false);
        assert.deepStrictEqual(table.getLines(), ['', 'Hello']);
        
        table = buildPieceTable(['Hello'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello']);

        table = buildPieceTable(['Hello\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);
        
        table = buildPieceTable(['Hello\nWorld'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\nWorld\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);
    });

    test('getLines - one chunk - normalized', () => {
        let table = buildPieceTable([''], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable(['\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r\nHello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', 'Hello']);
        
        table = buildPieceTable(['Hello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello']);

        table = buildPieceTable(['Hello\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);
        
        table = buildPieceTable(['Hello\nWorld'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\nWorld\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', 'Again']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', 'Again', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', 'Again', '']);

        table = buildPieceTable(['Hello\nWorld\r\nAgain\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', 'Again', '']);
    });

    test('getLines - mutiple chunks - unnormalized', () => {
        let table = buildPieceTable(['', ''], false);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable(['\r', '\r'], false);
        assert.deepStrictEqual(table.getLines(), ['', '', '']);

        table = buildPieceTable(['\r', '\n'], false);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r', '\nHello'], false);
        assert.deepStrictEqual(table.getLines(), ['', 'Hello']);
        
        table = buildPieceTable(['He', 'llo'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello']);

        table = buildPieceTable(['Hello' ,'\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r', '\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);
        
        table = buildPieceTable(['Hello', '\nWorld'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello', '\n', 'World'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World😁', '']);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], false);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World😁', '']);
    });

    test('getLines - mutiple chunks - normalized', () => {
        let table = buildPieceTable(['', ''], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['']);

        table = buildPieceTable(['\r', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', '', '']);

        table = buildPieceTable(['\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', '']);

        table = buildPieceTable(['\r', '\nHello'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['', 'Hello']);
        
        table = buildPieceTable(['He', 'llo'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello']);

        table = buildPieceTable(['Hello' ,'\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hel', 'lo\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);

        table = buildPieceTable(['Hello\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', '']);
        
        table = buildPieceTable(['Hello', '\nWorld'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello', '\n', 'World'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World']);

        table = buildPieceTable(['Hello\n', 'World\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);
        
        table = buildPieceTable(['Hello', '\nWorld', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello', '\n', 'World', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\n', 'World\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        table = buildPieceTable(['Hello\nW', 'orld\r', '\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World', '']);

        let surrogates = '😁';

        table = buildPieceTable(['Hello\nW', 'orld😁', '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World😁', '']);

        table = buildPieceTable(['Hello\nW', 'orld', surrogates.charAt(0), surrogates.charAt(1) + '\r\n'], true, EndOfLineType.LF);
        assert.deepStrictEqual(table.getLines(), ['Hello', 'World😁', '']);
    });

});
