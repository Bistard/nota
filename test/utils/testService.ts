/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { tmpdir } from "os";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { join } from "src/base/common/files/path";
import { URI } from "src/base/common/files/uri";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { AbstractLogger, ILogService } from "src/base/common/logger";
import { IKeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { ContextService } from "src/platform/context/common/contextService";
import { DiskEnvironmentService } from "src/platform/environment/common/diskEnvironmentService";
import { IBrowserEnvironmentService, IEnvironmentService } from "src/platform/environment/common/environment";
import { ClientBase, IClientConnectEvent, ServerBase } from "src/platform/ipc/common/net";
import { IProtocol } from "src/platform/ipc/common/protocol";
import { AbstractLifecycleService } from "src/platform/lifecycle/common/abstractLifecycleService";
import { IWindowConfiguration } from "src/platform/window/common/window";
import { nullObject } from "test/utils/helpers";

export const NotaName = 'nota';
export const TestDirName = 'tests';
export const TestPath = URI.toFsPath(URI.fromFile(join(tmpdir(), NotaName, TestDirName))); // make sure the disk schema is lowercase.
export const TestURI = URI.fromFile(TestPath);

export namespace TestIPC {

    export class IpcServer extends ServerBase {

        private readonly _onDidClientConnect: Emitter<IClientConnectEvent>;

        constructor() {
            const onDidClientConnect = new Emitter<IClientConnectEvent>();
            super(onDidClientConnect.registerListener, new NullLogger());
            this._onDidClientConnect = onDidClientConnect;
            this.__register(onDidClientConnect);
        }

        public createConnection(id: string): ClientBase {
            const [pc, ps] = __createProtocolPair();
            const client = new IpcClient(pc, id);

            this._onDidClientConnect.fire({
                clientID: id,
                protocol: ps,
                onClientDisconnect: client.onDidDisconnect
            });

            return client;
        }
    }

    class IpcClient extends ClientBase {

        private readonly _onDidDisconnect = new Emitter<void>();
        public readonly onDidDisconnect = this._onDidDisconnect.registerListener;

        constructor(protocol: IProtocol, id: string) {
            super(protocol, id, () => { });
        }

        public override dispose(): void {
            this._onDidDisconnect.fire();
            super.dispose();
        }
    }

    class QueueProtocol implements IProtocol {

        // [event]

        private readonly _onMessage = new Emitter<DataBuffer>({
            onFirstListenerDidAdd: () => {
                // only fire the events when there is a listener, in case fires in advance.
                for (const buffer of this._buffers) {
                    this._onMessage.fire(buffer);
                }
                this._buffers = [];
                this._buffering = false;
            },
            onLastListenerRemoved: () => {
                this._buffering = true;
            }
        });
        
        public readonly onData = this._onMessage.registerListener;

        // [fields]

        private _buffering = true;
        private _buffers: DataBuffer[] = [];
        public other!: QueueProtocol;

        // [methods]

        public send(buffer: DataBuffer): void {
            this.other.receive(buffer);
        }

        protected receive(buffer: DataBuffer): void {
            if (this._buffering) {
                this._buffers.push(buffer);
            } else {
                this._onMessage.fire(buffer);
            }
        }
    }

    /**
     * @internal
     */
    export function __createProtocolPair(): [IProtocol, IProtocol] {
        const one = new QueueProtocol();
        const other = new QueueProtocol();
        one.other = other;
        other.other = one;
        return [one, other];
    }
}

export class NullLifecycleService extends AbstractLifecycleService<number, number> {

    constructor() {
        super('Test', 0, () => '', new NullLogger());
    }

    public override async quit(): Promise<void> {
        this._onBeforeQuit.fire();
        this._onWillQuit.fire({ reason: 1, join: () => { } });
    }
}

export class NullEnvironmentService extends DiskEnvironmentService implements IEnvironmentService {
    constructor() {
        super({
            _: [],
        }, {
            appRootPath: 'temp/',
            isPackaged: false,
            tmpDirPath: 'temp/',
            userDataPath: 'temp/',
            userHomePath: 'temp/',
        },
        new NullLogger(),
        );
    }
}

export class NullBrowserEnvironmentService extends DiskEnvironmentService implements IBrowserEnvironmentService {

    constructor() {
        super({
            _: []
        }, {
            appRootPath: 'temp/',
            isPackaged: false,
            tmpDirPath: 'temp/',
            userDataPath: 'temp/',
            userHomePath: 'temp/',
        },
        new NullLogger(),
        );
    }

    get machineID(): string {
        return 'unknown';
    }

    get windowID(): number {
        return NaN;
    }

    get configuration(): IWindowConfiguration {
        return nullObject();
    }
}

export class NullLogger extends AbstractLogger implements ILogService {
    constructor() {
        super();
    }
    public trace(message: string, ...args: any[]): void { }
    public debug(message: string, ...args: any[]): void { }
    public info(message: string, ...args: any[]): void { }
    public warn(message: string, ...args: any[]): void { }
    public error(message: string | Error, ...args: any[]): void { }
    public fatal(message: string | Error, ...args: any[]): void { }
    public async flush(): Promise<void> { }
}

export class NullContextService extends ContextService { }

export class TestKeyboardService implements IKeyboardService {

    declare _serviceMarker: undefined;

    private readonly _emitter: Emitter<IStandardKeyboardEvent> = new Emitter();

    constructor() { }

    public fire(event: IStandardKeyboardEvent): void {
        this._emitter.fire(event);
    }

    get onKeydown(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }

    get onKeyup(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }

    get onKeypress(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }

    public dispose(): void {
        this._emitter.dispose();
    }
}