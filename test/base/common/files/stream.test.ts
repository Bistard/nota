import * as assert from 'assert';
import { DataBuffer } from 'src/base/common/files/buffer';
import { bufferToStream, consumeStream, listenStream, newWriteableBufferStream, newWriteableStream, streamToBuffer, toStream } from 'src/base/common/files/stream';

suite('stream-test', () => {

    test('bufferToStream / streamToBuffer', async () => {
		const content = 'Hello World';
		const stream = bufferToStream(DataBuffer.fromString(content));
		assert.strictEqual((await streamToBuffer(stream)).toString(), content);
	});

    test('bufferWriteableStream - basics (no error)', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

    test('bufferWriteableStream - basics (error)', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

    test('bufferWriteableStream - buffers data when no listener', () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'HelloWorld');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - buffers errors when no listener', () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.error(new Error());

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		const errors: Error[] = [];
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

	test('bufferWriteableStream - buffers end when no listener', () => {
		const stream = newWriteableBufferStream();

		stream.write(DataBuffer.fromString('Hello'));
		stream.end(DataBuffer.fromString('World'));

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		const errors: Error[] = [];
		stream.on('error', error => {
			errors.push(error);
		});

		assert.strictEqual(chunks.length, 1);
		assert.strictEqual(chunks[0]!.toString(), 'HelloWorld');
		assert.strictEqual(ended, true);
		assert.strictEqual(errors.length, 0);
	});

	test('bufferWriteableStream - nothing happens after end()', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
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

	test('bufferWriteableStream - pause/resume (simple)', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

	test('bufferWriteableStream - pause/resume (pause after first write)', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

	test('bufferWriteableStream - pause/resume (error)', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

	test('bufferWriteableStream - destroy', () => {
		const stream = newWriteableBufferStream();

		const chunks: DataBuffer[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		let ended = false;
		stream.on('end', () => {
			ended = true;
		});

		const errors: Error[] = [];
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

	test('WriteableStream - basics', () => {
		const stream = newWriteableStream<string>(strings => strings.join());

		let error = false;
		stream.on('error', e => {
			error = true;
		});

		let end = false;
		stream.on('end', () => {
			end = true;
		});

		stream.write('Hello');

		const chunks: string[] = [];
		stream.on('data', data => {
			chunks.push(data);
		});

		assert.strictEqual(chunks[0], 'Hello');

		stream.write('World');
		assert.strictEqual(chunks[1], 'World');

		assert.strictEqual(error, false);
		assert.strictEqual(end, false);

		stream.pause();
		stream.write('1');
		stream.write('2');
		stream.write('3');

		assert.strictEqual(chunks.length, 2);

		stream.resume();

		assert.strictEqual(chunks.length, 3);
		assert.strictEqual(chunks[2], '1,2,3');

		stream.error(new Error());
		assert.strictEqual(error, true);

		error = false;
		stream.error(new Error());
		assert.strictEqual(error, true);

		stream.end('Final Bit');
		assert.strictEqual(chunks.length, 4);
		assert.strictEqual(chunks[3], 'Final Bit');
		assert.strictEqual(end, true);

		stream.destroy();

		stream.write('Unexpected');
		assert.strictEqual(chunks.length, 4);
	});

	test('WriteableStream - end with empty string works', async () => {
		const reducer = (strings: string[]) => strings.length > 0 ? strings.join() : 'error';
		const stream = newWriteableStream<string>(reducer);
		stream.end('');

		const result = await consumeStream(stream, reducer);
		assert.strictEqual(result, '');
	});

	test('WriteableStream - end with error works', async () => {
		const reducer = (errors: Error[]) => errors[0]!;
		const stream = newWriteableStream<Error>(reducer);
		stream.end(new Error('error'));

		const result = await consumeStream(stream, reducer);
		assert.ok(result instanceof Error);
	});

	test('WriteableStream - removeListener', () => {
		const stream = newWriteableStream<string>(strings => strings.join());

		let error = false;
		const errorListener = (e: Error) => {
			error = true;
		};
		stream.on('error', errorListener);

		let data = false;
		const dataListener = () => {
			data = true;
		};
		stream.on('data', dataListener);

		stream.write('Hello');
		assert.strictEqual(data, true);

		data = false;
		stream.removeListener('data', dataListener);

		stream.write('World');
		assert.strictEqual(data, false);

		stream.error(new Error());
		assert.strictEqual(error, true);

		error = false;
		stream.removeListener('error', errorListener);

		// always leave at least one error listener to streams to avoid unexpected errors during test running
		stream.on('error', () => { });
		stream.error(new Error());
		assert.strictEqual(error, false);
	});

	test('consumeStream - without reducer and error', async () => {
		const stream = newWriteableStream<string>(strings => strings.join());
		stream.error(new Error());

		const consumed = await consumeStream(stream);
		assert.strictEqual(consumed, undefined);
	});

	test('listenStream', () => {
		const stream = newWriteableStream<string>(strings => strings.join());

		let error = false;
		let end = false;
		let data = '';

		listenStream(stream, {
			onData: d => {
				data = d;
			},
			onError: e => {
				error = true;
			},
			onEnd: () => {
				end = true;
			}
		});

		stream.write('Hello');

		assert.strictEqual(data, 'Hello');

		stream.write('World');
		assert.strictEqual(data, 'World');

		assert.strictEqual(error, false);
		assert.strictEqual(end, false);

		stream.error(new Error());
		assert.strictEqual(error, true);

		stream.end('Final Bit');
		assert.strictEqual(end, true);
	});

	test('toStream', async () => {
		const stream = toStream('1,2,3,4,5', strings => strings.join());
		const consumed = await consumeStream(stream, strings => strings.join());
		assert.strictEqual(consumed, '1,2,3,4,5');
	});

	test('events are delivered even if a listener is removed during delivery', () => {
		const stream = newWriteableStream<string>(strings => strings.join());

		let listener1Called = false;
		let listener2Called = false;

		const listener1 = () => { stream.removeListener('end', listener1); listener1Called = true; };
		const listener2 = () => { listener2Called = true; };
		stream.on('end', listener1);
		stream.on('end', listener2);
		stream.on('data', () => { });
		stream.end('');

		assert.strictEqual(listener1Called, true);
		assert.strictEqual(listener2Called, true);
	});
});