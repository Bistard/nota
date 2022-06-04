import * as assert from 'assert';
import { TextBuffer, TextBufferBuilder } from 'src/editor/model/textBuffer';


suite('textBufferBuilder-test', () => {

    test('basic build', () => {

        const builder = new TextBufferBuilder();
        builder.receive('chris');
        builder.receive('fiona\n');
        builder.receive('peter\r\n');

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, 'fiona\n');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 6]);
        assert.deepStrictEqual(chunks[2]!.buffer, 'peter\r\n');
        assert.deepStrictEqual(chunks[2]!.linestart, [0, 7]);
    });

    test('empty build', () => {
        const builder = new TextBufferBuilder();

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
    });

    test('oneline build', () => {
        let builder = new TextBufferBuilder();
        builder.receive('chris');
        builder.build();
        let chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);

        builder = new TextBufferBuilder();
        builder.receive('');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);

        builder = new TextBufferBuilder();
        builder.receive('\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '\r');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 1]);

        builder = new TextBufferBuilder();
        builder.receive('\n');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '\n');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 1]);
    });

    test('multiple lines build', () => {
        let builder = new TextBufferBuilder();
        builder.receive('\r\n');
        builder.build();
        let chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '\r\n');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 2]);

        builder = new TextBufferBuilder();
        builder.receive('\r1\n');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '\r1\n');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 1, 3]);

        builder = new TextBufferBuilder();
        builder.receive('\r1\n2');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '\r1\n2');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 1, 3]);
        
        builder = new TextBufferBuilder();
        builder.receive('chris\r\n');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris\r\n');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 7]);

        builder = new TextBufferBuilder();
        builder.receive('chris\n');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris\n');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 6]);

        builder = new TextBufferBuilder();
        builder.receive('chris\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris\r');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 6]);

        builder = new TextBufferBuilder();
        builder.receive('chris\n\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'chris\n\r');
        assert.deepStrictEqual(chunks[0]!.linestart, [0, 6, 7]);
    });

    test('chunk ended with carriage return', () => {
        let builder = new TextBufferBuilder();
        builder.receive('fiona\r');
        builder.receive('\npeter\r\n');
        builder.build();
        let chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'fiona');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, '\r\npeter\r\n');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 2, 9]);

        builder = new TextBufferBuilder();
        builder.receive('\r');
        builder.receive('\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, '\r\r');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 1, 2]);

        builder = new TextBufferBuilder();
        builder.receive('\r');
        builder.receive('\r\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, '\r\r\r');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 1, 2, 3]);

        builder = new TextBufferBuilder();
        builder.receive('\r');
        builder.receive('\r');
        builder.receive('\r');
        builder.build();
        chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, '');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, '\r');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 1]);
        assert.deepStrictEqual(chunks[2]!.buffer, '\r\r');
        assert.deepStrictEqual(chunks[2]!.linestart, [0, 1, 2]);
    });

    test('chunk ended with surrogates', () => {
        const builder = new TextBufferBuilder();
        const surrogates = '😁';
        builder.receive('fiona' + surrogates.charAt(0));
        builder.receive(surrogates.charAt(1) + 'peter\r\n');

        builder.build();

        const chunks = (builder as any)._chunks as TextBuffer[];
        assert.deepStrictEqual(chunks[0]!.buffer, 'fiona');
        assert.deepStrictEqual(chunks[0]!.linestart, [0]);
        assert.deepStrictEqual(chunks[1]!.buffer, '😁peter\r\n');
        assert.deepStrictEqual(chunks[1]!.linestart, [0, 9]);
    });

});