import * as assert from 'assert';
import { after, before } from 'mocha';
import { INSTANT_TIME, Time, TimeUnit } from 'src/base/common/date';
import { Emitter, Event, Register } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/files/buffer';
import { URI } from 'src/base/common/files/uri';
import { delayFor } from 'src/base/common/utilities/async';
import { IService } from 'src/platform/instantiation/common/decorator';
import { IChannel, IServerChannel } from 'src/platform/ipc/common/channel';
import { ClientBase, ServerBase } from 'src/platform/ipc/common/net';
import { ProxyChannel } from 'src/platform/ipc/common/proxy';
import { TestIPC } from 'test/utils/testService';

const TestChannelId = 'testchannel';

interface ITestService extends IService {
	ping(message: string): Promise<void>;
	marco(): Promise<string>;
	error(message: string): Promise<void>;
	neverComplete(): Promise<void>;

	buffersLength(buffers: DataBuffer[]): Promise<number>;
	marshall(uri: URI): Promise<URI>;
	context(): Promise<unknown>;

	onPong: Register<string>;
}

class TestService implements ITestService {

	declare _serviceMarker: undefined;

	private readonly _onPong = new Emitter<string>();
	readonly onPong = this._onPong.registerListener;

	marco(): Promise<string> {
		return Promise.resolve('polo');
	}

	error(message: string): Promise<void> {
		return Promise.reject(new Error(message));
	}

	neverComplete(): Promise<void> {
		return new Promise(_ => { });
	}

	buffersLength(buffers: DataBuffer[]): Promise<number> {
		return Promise.resolve(buffers.reduce((r, b) => r + b.buffer.length, 0));
	}

	async ping(msg: string): Promise<void> {
		this._onPong.fire(msg);
	}

	marshall(uri: URI): Promise<URI> {
		return Promise.resolve(uri);
	}

	context(context?: unknown): Promise<unknown> {
		return Promise.resolve(context);
	}
}

class TestServerChannel implements IServerChannel {

	constructor(private service: ITestService) { }

	callCommand(_: unknown, command: string, arg: any[]): Promise<any> {
		switch (command) {
			case 'marco': return this.service.marco();
			case 'error': return this.service.error(arg[0]);
			case 'neverComplete': return this.service.neverComplete();
			case 'buffersLength': return this.service.buffersLength(arg[0]);
			default: return Promise.reject(new Error('not implemented'));
		}
	}

	registerListener(_: unknown, event: string, arg?: any): Register<any> {
		switch (event) {
			case 'onPong': return this.service.onPong;
			default: throw new Error('not implemented');
		}
	}
}

class TestClientChannel implements ITestService {

	declare _serviceMarker: undefined;

	get onPong(): Register<string> {
		return this.channel.registerListener('onPong');
	}

	constructor(private channel: IChannel) { }

	marco(): Promise<string> {
		return this.channel.callCommand('marco');
	}

	error(message: string): Promise<void> {
		return this.channel.callCommand('error', [message]);
	}

	neverComplete(): Promise<void> {
		return this.channel.callCommand('neverComplete');
	}

	buffersLength(buffers: DataBuffer[]): Promise<number> {
		return this.channel.callCommand('buffersLength', [buffers]);
	}

	marshall(uri: URI): Promise<URI> {
		return this.channel.callCommand('marshall', [uri]);
	}

	context(): Promise<unknown> {
		return this.channel.callCommand('context');
	}

	ping(message: string): Promise<void> {
		return this.channel.callCommand('ping', [message]);
	}
}

suite('IPC-test', function () {

	test('createProtocolPair', async function () {
		const [clientProtocol, serverProtocol] = TestIPC.__createProtocolPair();

		const b1 = DataBuffer.alloc(0);
		clientProtocol.send(b1);

		const b3 = DataBuffer.alloc(0);
		serverProtocol.send(b3);

		const b2 = await Event.toPromise(serverProtocol.onData);
		const b4 = await Event.toPromise(clientProtocol.onData);

		assert.strictEqual(b1, b2);
		assert.strictEqual(b3, b4);
	});

	suite('one to one', function () {
		let server: ServerBase;
		let client: ClientBase;
		let service: TestService;
		let ipcService: ITestService;

		before(function () {
			service = new TestService();
			const testServer = new TestIPC.IpcServer();
			server = testServer;
			server.registerChannel(TestChannelId, new TestServerChannel(service));
			client = testServer.createConnection('client1');
			ipcService = new TestClientChannel(client.getChannel(TestChannelId));
		});

		after(function () {
			client.dispose();
			server.dispose();
		});

		test('call success', async function () {
			const r = await ipcService.marco();
			return assert.strictEqual(r, 'polo');
		});

		test('call error', async function () {
			try {
				await ipcService.error('nice error');
				return assert.fail('should not reach here');
			} catch (err) {
				return assert.strictEqual((<Error>err).message, 'nice error');
			}
		});

		test('listen to events', async function () {
			const messages: string[] = [];

			ipcService.onPong(msg => messages.push(msg));
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, []);
			await service.ping('hello');
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, ['hello']);
			await service.ping('world');
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, ['hello', 'world']);
		});

		test('buffers in arrays', async function () {
			const r = await ipcService.buffersLength([DataBuffer.alloc(2), DataBuffer.alloc(3)]);
			return assert.strictEqual(r, 5);
		});
	});

	suite('one to one (proxy)', function () {
		let server: ServerBase;
		let client: ClientBase;
		let service: ITestService;
		let ipcService: ITestService;

		before(function () {
			service = new TestService();
			const testServer = new TestIPC.IpcServer();
			server = testServer;

			server.registerChannel(TestChannelId, ProxyChannel.wrapService(service));

			client = testServer.createConnection('client1');
			ipcService = ProxyChannel.unwrapChannel<ITestService>(client.getChannel(TestChannelId));
		});

		after(function () {
			client.dispose();
			server.dispose();
		});

		test('call success', async function () {
			const r = await ipcService.marco();
			return assert.strictEqual(r, 'polo');
		});

		test('call error', async function () {
			try {
				await ipcService.error('nice error');
				return assert.fail('should not reach here');
			} catch (err) {
				return assert.strictEqual((<Error>err).message, 'nice error');
			}
		});

		test('listen to events', async function () {
			const messages: string[] = [];

			ipcService.onPong(msg => messages.push(msg));
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, []);
			await service.ping('hello');
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, ['hello']);
			await service.ping('world');
			await delayFor(INSTANT_TIME);

			assert.deepStrictEqual(messages, ['hello', 'world']);
		});

		test('buffers in arrays', async function () {
			const r = await ipcService.buffersLength([DataBuffer.alloc(2), DataBuffer.alloc(3)]);
			return assert.strictEqual(r, 5);
		});
	});

	suite('one to many', function () {
		test('all clients get pinged', async function () {
			const service = new TestService();
			const channel = new TestServerChannel(service);
			const server = new TestIPC.IpcServer();
			server.registerChannel('channel', channel);

			let client1GotPinged = false;
			const client1 = server.createConnection('client1');
			const ipcService1 = new TestClientChannel(client1.getChannel('channel'));
			ipcService1.onPong(() => client1GotPinged = true);

			let client2GotPinged = false;
			const client2 = server.createConnection('client2');
			const ipcService2 = new TestClientChannel(client2.getChannel('channel'));
			ipcService2.onPong(() => client2GotPinged = true);

			await delayFor(new Time(TimeUnit.Milliseconds, 1));
			await service.ping('hello');

			await delayFor(new Time(TimeUnit.Milliseconds, 1));
			assert.ok(client1GotPinged);
			assert.ok(client2GotPinged);

			client1.dispose();
			client2.dispose();
			server.dispose();
		});
	});
});
