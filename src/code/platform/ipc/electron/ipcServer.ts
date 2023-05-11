import { IpcMainEvent, WebContents } from "electron";
import { DisposableManager, IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, Event, NodeEventEmitter, Register, SignalEmitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { ILogService } from "src/base/common/logger";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { ClientConnectEvent, ServerBase } from "src/code/platform/ipc/common/net";
import { Protocol } from "src/code/platform/ipc/common/protocol";
import { SafeIpcMain } from "src/code/platform/ipc/electron/safeIpcMain";

/**
 * @class An implementation of {@link ServerBase} that wraps the {@link SafeIpcMain}
 * as the protocol communication.
 * @note Should be used in main process side.
 */
export class IpcServer extends ServerBase {

    // [field]

    private static readonly _activedClients = new Map<number, IDisposable>();
    private static _disposable = new DisposableManager();

    // [constructor]

    constructor(logService: ILogService) {
        super(IpcServer.__createOnClientConnect(), logService);
    }

    // [public methods]

    public override dispose(): void {
        IpcServer._disposable.dispose();
        for (const [id, client] of IpcServer._activedClients) {
            client.dispose();
        }
        super.dispose();
    }

    // [private helper methods]

    private static __createOnClientConnect(): Register<ClientConnectEvent> {
        const onRawConnect = new NodeEventEmitter<IpcMainEvent>(SafeIpcMain.instance, IpcChannel.Connect);
        IpcServer._disposable.register(onRawConnect);

        return Event.map<IpcMainEvent, ClientConnectEvent>(onRawConnect.registerListener, (event) => {
            const client = event.sender;
            const clientID = client.id;
            
            const handle = IpcServer._activedClients.get(clientID);
            if (handle) {
                handle.dispose();
            }

            const onClientReconnect = new Emitter<void>();
            IpcServer._activedClients.set(clientID, toDisposable(() => {
                onClientReconnect.fire();
                onClientReconnect.dispose();
            }));

            const [onDataDisposable, onDataRegister] = scopedOnDataEvent(IpcChannel.DataChannel, clientID);
            const [onDisconnectDisposable, onDisconnectRegister] = scopedOnDataEvent(IpcChannel.Disconnect, clientID);
            const onDisconnect = new SignalEmitter<DataBuffer, void>([onDisconnectRegister], data => (void 0));

            IpcServer._disposable.register(onDataDisposable);
            IpcServer._disposable.register(onDisconnectDisposable);
            return {
                clientID: clientID,
                protocol: new Protocol(client, onDataRegister),
                onClientDisconnect: Event.any([onDisconnect.registerListener, onClientReconnect.registerListener]),
            };
        });
    }
}

interface IIpcEvent {
	event: { sender: WebContents; };
	data: Buffer | null;
}

function scopedOnDataEvent(eventName: string, filterID: number): [IDisposable, Register<DataBuffer>] {
	const onDataEmitter = new NodeEventEmitter<IIpcEvent>(SafeIpcMain.instance, eventName, (event, data) => {
        return ({ event, data });
    });
	const onDataFromID = Event.filter(onDataEmitter.registerListener, ({ event }) => {
        return event.sender.id === filterID;
    });
	return [onDataEmitter, Event.map(onDataFromID, ({ data }) => data ? DataBuffer.wrap(data) : DataBuffer.alloc(0))];
}