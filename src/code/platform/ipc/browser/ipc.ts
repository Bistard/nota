import { IpcMainEvent, WebContents } from "electron";
import { IDisposable, toDisposable } from "src/base/common/dispose";
import { Emitter, Event, NodeEventEmitter, Register, SignalEmitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { ILogService } from "src/base/common/logger";
import { ipcRenderer } from "src/code/platform/electron/browser/global";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { ClientBase, ClientConnectEvent, ServerBase } from "src/code/platform/ipc/common/net";
import { Protocol } from "src/code/platform/ipc/common/protocol";
import { SafeIpcMain } from "src/code/platform/ipc/electron/safeIpcMain";

/**
 * @class An implementation of {@link ClientBase} that wraps the {@link ipcRenderer}
 * as the protocol communication.
 * @note Should be used in renderer process side.
 */
export class IpcClient extends ClientBase {

    // [constructor]

    constructor(id: string) {
        super(IpcClient.__createProtocol(), id, () => ipcRenderer.send(IpcChannel.Connect));
    }

    // [private helper methods]

    private static __createProtocol(): Protocol {
        /**
         * We register a channel listener on {@link IpcChannel.DataChannel} into
         * our own {@link ipcRenderer} and every time we receive data we wrap it 
         * with data buffer.
         */
        const nodeEmitter = new NodeEventEmitter<DataBuffer>(ipcRenderer, IpcChannel.DataChannel, (event, data) => {
            return DataBuffer.wrap(data);
        });
        return new Protocol(ipcRenderer, nodeEmitter.registerListener);
    }
}

/**
 * @class An implementation of {@link ServerBase} that wraps the {@link SafeIpcMain}
 * as the protocol communication.
 * @note Should be used in main process side.
 */
export class IpcServer extends ServerBase {

    // [field]

    private static readonly _activedClients = new Map<number, IDisposable>();

    // [constructor]

    constructor(logService: ILogService) {
        super(IpcServer.__createOnClientConnect(), logService);
    }

    // [public methods]

    public override dispose(): void {
        super.dispose();
        for (const [id, client] of IpcServer._activedClients) {
            client.dispose();
        }
    }

    // [private helper methods]

    private static __createOnClientConnect(): Register<ClientConnectEvent> {
        const onRawConnect = new NodeEventEmitter<IpcMainEvent>(SafeIpcMain.instance, IpcChannel.Connect);
        
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

            const onData = scopedOnDataEvent(IpcChannel.DataChannel, clientID);
            const onDisconnect = new SignalEmitter<DataBuffer, void>([scopedOnDataEvent(IpcChannel.Disconnect, clientID)], data => (void 0));
            
            return {
                clientID: clientID,
                protocol: new Protocol(client, onData),
                onClientDisconnect: Event.any([onDisconnect.registerListener, onClientReconnect.registerListener]),
            };
        });
    }
}

interface IIpcEvent {
	event: { sender: WebContents; };
	data: Buffer | null;
}

function scopedOnDataEvent(eventName: string, filterID: number): Register<DataBuffer> {
	const onData = new NodeEventEmitter<IIpcEvent>(SafeIpcMain.instance, eventName, (event, data) => {
        return ({ event, data });
    });
	const onDataFromID = Event.filter(onData.registerListener, ({ event }) => {
        return event.sender.id === filterID;
    });
	return Event.map(onDataFromID, ({ data }) => data ? DataBuffer.wrap(data) : DataBuffer.alloc(0));
}