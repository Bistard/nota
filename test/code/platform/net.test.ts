import * as assert from 'assert';
import { Emitter, Event, Register } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from 'src/base/common/file/uri';
import { delayFor } from 'src/base/common/util/async';
import { mockType } from 'src/base/common/util/type';
import { IChannel, IServerChannel } from 'src/code/platform/ipc/common/channel';
import { ClientConnectEvent, ClientBase, ServerBase } from 'src/code/platform/ipc/common/net';
import { IIpcProtocol } from 'src/code/platform/ipc/common/protocol';
import { ProxyChannel } from 'src/code/platform/ipc/common/proxy';
import { NullLogger } from 'test/utils/utility';


class QueueProtocol implements IIpcProtocol {

	private buffering = true;
	private buffers: DataBuffer[] = [];

	private readonly _onMessage = new Emitter<DataBuffer>({
		onFirstListenerDidAdd: () => {
			for (const buffer of this.buffers) {
				this._onMessage.fire(buffer);
			}
			this.buffers = [];
			this.buffering = false;
		},
		onLastListenerRemoved: () => {
			this.buffering = true;
		}
	});

	readonly onData = this._onMessage.registerListener;
	other!: QueueProtocol;

	send(buffer: DataBuffer): void {
		this.other.receive(buffer);
	}

	protected receive(buffer: DataBuffer): void {
		if (this.buffering) {
			this.buffers.push(buffer);
		} else {
			this._onMessage.fire(buffer);
		}
	}
}

function createProtocolPair(): [IIpcProtocol, IIpcProtocol] {
	const one = new QueueProtocol();
	const other = new QueueProtocol();
	one.other = other;
	other.other = one;

	return [one, other];
}

class TestIPCClient extends ClientBase {

	private readonly _onDidDisconnect = new Emitter<void>();
	readonly onDidDisconnect = this._onDidDisconnect.registerListener;

	constructor(protocol: IIpcProtocol, id: string) {
		super(protocol, id, () => {});
	}

	public override dispose(): void {
        
		this._onDidDisconnect.fire();
		super.dispose();
	}
}

class TestIPCServer extends ServerBase {

	private readonly onDidClientConnect: Emitter<ClientConnectEvent>;

	constructor() {
		const onDidClientConnect = new Emitter<ClientConnectEvent>();
		super(onDidClientConnect.registerListener, new NullLogger());
		this.onDidClientConnect = onDidClientConnect;
	}

	createConnection(id: string): ClientBase {
		const [pc, ps] = createProtocolPair();
		const client = new TestIPCClient(pc, id);

		this.onDidClientConnect.fire({
			clientID: id,
			protocol: ps,
			onClientDisconnect: client.onDidDisconnect
		});

		return client;
	}
}

const TestChannelId = 'testchannel';

interface ITestService {
	marco(): Promise<string>;
	error(message: string): Promise<void>;
	neverComplete(): Promise<void>;
	
	buffersLength(buffers: DataBuffer[]): Promise<number>;
	marshall(uri: URI): Promise<URI>;
	context(): Promise<unknown>;

	onPong: Register<string>;
}

class TestService implements ITestService {

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

	ping(msg: string): void {
		this._onPong.fire(msg);
	}

	marshall(uri: URI): Promise<URI> {
		return Promise.resolve(uri);
	}

	context(context?: unknown): Promise<unknown> {
		return Promise.resolve(context);
	}
}

class TestChannel implements IServerChannel {

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

class TestChannelClient implements ITestService {

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
}

suite('IPC-test', function () {

	test('createProtocolPair', async function () {
		const [clientProtocol, serverProtocol] = createProtocolPair();

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

		setup(function () {
			service = new TestService();
			const testServer = new TestIPCServer();
			server = testServer;
			server.registerChannel(TestChannelId, new TestChannel(service));
			client = testServer.createConnection('client1');
			ipcService = new TestChannelClient(client.getChannel(TestChannelId));
		});

		teardown(function () {
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
			await delayFor(0);

			assert.deepStrictEqual(messages, []);
			service.ping('hello');
			await delayFor(0);

			assert.deepStrictEqual(messages, ['hello']);
			service.ping('world');
			await delayFor(0);

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
		let service: TestService;
		let ipcService: ITestService;

		setup(function () {
			service = new TestService();
			const testServer = new TestIPCServer();
			server = testServer;

			server.registerChannel(TestChannelId, ProxyChannel.wrapService(service));

			client = testServer.createConnection('client1');
			ipcService = mockType(ProxyChannel.unwrapChannel(client.getChannel(TestChannelId)));
		});

		teardown(function () {
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
			await delayFor(0);

			assert.deepStrictEqual(messages, []);
			service.ping('hello');
			await delayFor(0);

			assert.deepStrictEqual(messages, ['hello']);
			service.ping('world');
			await delayFor(0);

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
			const channel = new TestChannel(service);
			const server = new TestIPCServer();
			server.registerChannel('channel', channel);

			let client1GotPinged = false;
			const client1 = server.createConnection('client1');
			const ipcService1 = new TestChannelClient(client1.getChannel('channel'));
			ipcService1.onPong(() => client1GotPinged = true);

			let client2GotPinged = false;
			const client2 = server.createConnection('client2');
			const ipcService2 = new TestChannelClient(client2.getChannel('channel'));
			ipcService2.onPong(() => client2GotPinged = true);

			await delayFor(1);
			service.ping('hello');

			await delayFor(1);
			assert.ok(client1GotPinged);
			assert.ok(client2GotPinged);

			client1.dispose();
			client2.dispose();
			server.dispose();
		});

    //     // TODO
	// 	// test('server gets pings from all clients (broadcast channel)', async function () {
	// 	// 	const server = new TestIPCServer();

	// 	// 	const client1 = server.createConnection('client1');
	// 	// 	const clientService1 = new TestService();
	// 	// 	const clientChannel1 = new TestChannel(clientService1);
	// 	// 	client1.registerChannel('channel', clientChannel1);

	// 	// 	const pings: string[] = [];
	// 	// 	const channel = server.getChannel('channel', () => true);
	// 	// 	const service = new TestChannelClient(channel);
	// 	// 	service.onPong(msg => pings.push(msg));

	// 	// 	await delayFor(1);
	// 	// 	clientService1.ping('hello 1');

	// 	// 	await delayFor(1);
	// 	// 	assert.deepStrictEqual(pings, ['hello 1']);

	// 	// 	const client2 = server.createConnection('client2');
	// 	// 	const clientService2 = new TestService();
	// 	// 	const clientChannel2 = new TestChannel(clientService2);
	// 	// 	client2.registerChannel('channel', clientChannel2);

	// 	// 	await delayFor(1);
	// 	// 	clientService2.ping('hello 2');

	// 	// 	await delayFor(1);
	// 	// 	assert.deepStrictEqual(pings, ['hello 1', 'hello 2']);

	// 	// 	client1.dispose();
	// 	// 	clientService1.ping('hello 1');

	// 	// 	await delayFor(1);
	// 	// 	assert.deepStrictEqual(pings, ['hello 1', 'hello 2']);

	// 	// 	await delayFor(1);
	// 	// 	clientService2.ping('hello again 2');

	// 	// 	await delayFor(1);
	// 	// 	assert.deepStrictEqual(pings, ['hello 1', 'hello 2', 'hello again 2']);

	// 	// 	client2.dispose();
	// 	// 	server.dispose();
	// 	// });
	});
});
