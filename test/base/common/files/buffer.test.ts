import * as assert from 'assert';
import { DataBuffer } from 'src/base/common/files/buffer';
import { streamToBuffer } from 'src/base/common/files/stream';

suite('buffer-test', () => {

    test('DataBuffer#toString()', () => {
        const data = new Uint8Array([1, 2, 3, 'h'.charCodeAt(0), 'i'.charCodeAt(0), 4, 5]).buffer;
		const buffer = DataBuffer.wrap(new Uint8Array(data, 3, 2));
		assert.deepStrictEqual(buffer.toString(), 'hi');
    });

    test('DataBuffer#fromString()', () => {
        const buffer = DataBuffer.fromString('Hello World');
        assert.deepStrictEqual(buffer.toString(), 'Hello World');
    });

    test('DataBuffer#concat()', () => {
        const content1 = DataBuffer.fromString('Hello');
        const content2 = DataBuffer.fromString(' ');
        const content3 = DataBuffer.fromString('World');
        assert.deepStrictEqual(DataBuffer.concat([content1, content2, content3]).toString(), 'Hello World');
    });

});