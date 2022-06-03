import * as assert from 'assert';
import { TextBuffer, TextBufferBuilder } from 'src/editor/model/textBuffer';


suite('textBufferBuilder', () => {

    test('basic build', () => {

        const builder = new TextBufferBuilder();
        builder.receive('chris');
        builder.receive('fiona\n');
        builder.receive('peter\r\n');

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.strictEqual(chunks[0]!.buffer, 'chris');
        assert.strictEqual(chunks[0]!.linestart, [0]);
        assert.strictEqual(chunks[1]!.buffer, 'fiona\n');
        assert.strictEqual(chunks[1]!.linestart, [0, 6]);
        assert.strictEqual(chunks[2]!.buffer, 'peter\r\n');
        assert.strictEqual(chunks[2]!.linestart, [0, 7]);
    });

    test('empty build', () => {
        const builder = new TextBufferBuilder();

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.strictEqual(chunks[0]!.buffer, '');
        assert.strictEqual(chunks[0]!.linestart, [0]);
    });

    test('oneline build', () => {
        const builder = new TextBufferBuilder();

        builder.receive('chris');
        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.strictEqual(chunks[0]!.buffer, 'chris');
        assert.strictEqual(chunks[0]!.linestart, [0]);
    });

    test('chunk ended with carriage return', () => {
        const builder = new TextBufferBuilder();
        builder.receive('fiona\r');
        builder.receive('\npeter\r\n');

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.strictEqual(chunks[0]!.buffer, 'fiona');
        assert.strictEqual(chunks[0]!.linestart, [0]);
        assert.strictEqual(chunks[1]!.buffer, '\r\npeter\r\n');
        assert.strictEqual(chunks[1]!.linestart, [0, 2, 9]);
    });

    test('chunk ended with surrogates', () => {
        const builder = new TextBufferBuilder();
        builder.receive('fiona😁');
        builder.receive('peter\r\n');

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.strictEqual(chunks[0]!.buffer, 'fiona');
        assert.strictEqual(chunks[0]!.linestart, [0]);
        assert.strictEqual(chunks[1]!.buffer, '😁peter\r\n');
        assert.strictEqual(chunks[1]!.linestart, [0, 9]);
    });

});