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

});
