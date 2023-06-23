import { tmpdir } from "os";
import { Emitter, Register } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { AbstractLogger, ILogService } from "src/base/common/logger";
import { IKeyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { ContextService } from "src/code/platform/context/common/contextService";
import { DiskEnvironmentService } from "src/code/platform/environment/common/diskEnvironmentService";
import { IBrowserEnvironmentService, IEnvironmentService } from "src/code/platform/environment/common/environment";
import { ClientBase, ClientConnectEvent, ServerBase } from "src/code/platform/ipc/common/net";
import { IIpcProtocol } from "src/code/platform/ipc/common/protocol";
import { AbstractLifecycleService } from "src/code/platform/lifecycle/common/abstractLifecycleService";
import { IWindowConfiguration } from "src/code/platform/window/common/window";
import { nullObject } from "test/utils/helpers";

export const NotaName = 'nota';
export const TestDirName = 'tests';
export const TestPath = join(tmpdir(), NotaName, TestDirName);
export const TestURI = URI.fromFile(TestPath);

export namespace TestIPC {

    export class IpcServer extends ServerBase {
    
        private readonly _onDidClientConnect: Emitter<ClientConnectEvent>;
    
        constructor() {
            const onDidClientConnect = new Emitter<ClientConnectEvent>();
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
        readonly onDidDisconnect = this._onDidDisconnect.registerListener;
    
        constructor(protocol: IIpcProtocol, id: string) {
            super(protocol, id, () => {});
        }
    
        public override dispose(): void {
            
            this._onDidDisconnect.fire();
            super.dispose();
        }
    }
    
    class QueueProtocol implements IIpcProtocol {

        // [event]
    
        private readonly _onMessage = new Emitter<DataBuffer>({
            onFirstListenerDidAdd: () => {
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
        readonly onData = this._onMessage.registerListener;
    
        // [fields]
    
        private _buffering = true;
        private _buffers: DataBuffer[] = [];
        other!: QueueProtocol;
    
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
    export function __createProtocolPair(): [IIpcProtocol, IIpcProtocol] {
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
        this._onWillQuit.fire({reason: 1, join: () => {}});
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
        });
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
    public trace(message: string, ...args: any[]): void {}
    public debug(message: string, ...args: any[]): void {}
    public info(message: string, ...args: any[]): void {}
    public warn(message: string, ...args: any[]): void {}
    public error(message: string | Error, ...args: any[]): void {}
    public fatal(message: string | Error, ...args: any[]): void {}
    public async flush(): Promise<void> {}
}

export class NullContextService extends ContextService {}

export class TestKeyboardService implements IKeyboardService {

    _serviceMarker: undefined;

    private readonly _emitter: Emitter<IStandardKeyboardEvent> = new Emitter();

    constructor() {}

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

    dispose(): void {
        this._emitter.dispose();
    }
}