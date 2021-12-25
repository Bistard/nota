import * as assert from 'assert';
import { DataBuffer } from 'src/base/common/file/buffer';
import { bufferToStream, newWriteableBufferStream, streamToBuffer } from 'src/base/common/file/stream';

suite('stream-test', () => {

    test('bufferToStream / streamToBuffer', async () => {
		const content = 'Hello World';
		const stream = bufferToStream(DataBuffer.fromString(content));
		assert.strictEqual((await streamToBuffer(stream)).toString(), content);
	});

    test('bufferWriteableStream - basics (no error)', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		assert.strictEqual(chunks.length, 2);
		assert.strictEqual(chunks[0]!!.toString(), 'Hello');
		assert.strictEqual(chunks[1]!!.toString(), 'World');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

    test('bufferWriteableStream - basics (error)', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.write(DataBuffer.fromString('Hello'));
		stream.error(new Error());
		stream.end();

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!!.toString(), 'Hello');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 1);
	});

    test('bufferWriteableStream - buffers data when no listener', async () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'HelloWorld');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - buffers errors when no listener', async () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.error(new Error());

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		stream.end();

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'Hello');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 1);
	});

	test('bufferWriteableStream - buffers end when no listener', async () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'HelloWorld');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - nothing happens after end()', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		let dataCalledAfterEnd = false;
		stream.on('data', data => {
			dataCalledAfterEnd = true;
		});

		let errorCalledAfterEnd = false;
		stream.on('error', error => {
			errorCalledAfterEnd = true;
		});

		let endCalledAfterEnd = false;
		stream.on('end', () => {
			endCalledAfterEnd = true;
		});

		stream.write(DataBuffer.fromString('Hello'));
		stream.error(new Error());
		stream.end(DataBuffer.fromString('World'));

		assert.strictEqual(dataCalledAfterEnd, false);
		assert.strictEqual(errorCalledAfterEnd, false);
		assert.strictEqual(endCalledAfterEnd, false);

		assert.strictEqual(chunks.length, 2);
		assert.strictEqual(chunks[0]!.toString(), 'Hello');
		assert.strictEqual(chunks[1]!.toString(), 'World');
	});

	test('bufferWriteableStream - pause/resume (simple)', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.pause();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		assert.strictEqual(chunks.length, 0);
		assert.strictEqual(errors.length, 0);
		assert.strictEqual(ended, false);

		stream.resume();

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'HelloWorld');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - pause/resume (pause after first write)', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.write(DataBuffer.fromString('Hello'));

		stream.pause();

		stream.end(DataBuffer.fromString('World'));

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'Hello');
		assert.strictEqual(errors.length, 0);
		assert.strictEqual(ended, false);

		stream.resume();

		assert.strictEqual(chunks.length, 2);
		assert.strictEqual(chunks[0]!.toString(), 'Hello');
		assert.strictEqual(chunks[1]!.toString(), 'World');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - pause/resume (error)', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.pause();

		stream.write(DataBuffer.fromString('Hello'));
		stream.error(new Error());
		stream.end();

		assert.strictEqual(chunks.length, 0);
		assert.strictEqual(ended, false);
		assert.strictEqual(errors.length, 0);

		stream.resume();

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'Hello');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 1);
	});

	test('bufferWriteableStream - destroy', async () => {
		const stream = newWriteableBufferStream();

		let chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		let errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		stream.destroy();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		assert.strictEqual(chunks.length, 0);
		assert.strictEqual(ended, false);
		assert.strictEqual(errors.length, 0);
	});

});