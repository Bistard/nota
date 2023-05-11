import { DisposableManager } from "src/base/common/dispose";
import { NodeEventEmitter } from "src/base/common/event";
import { DataBuffer } from "src/base/common/file/buffer";
import { ipcRenderer } from "src/code/platform/electron/browser/global";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { ClientBase } from "src/code/platform/ipc/common/net";
import { IpcProtocol } from "src/code/platform/ipc/common/protocol";

/**
 * @class An implementation of {@link ClientBase} that wraps the {@link ipcRenderer}
 * as the protocol communication.
 * @note Should be used in renderer process side.
 */
export class IpcClient extends ClientBase {

    // [field]

    private static _disposable = new DisposableManager();

    // [constructor]

    constructor(id: string) {
        super(IpcClient.__createProtocol(), id, () => ipcRenderer.send(IpcChannel.Connect));
    }

    public override dispose(): void {
        IpcClient._disposable.dispose();
        super.dispose();
    }

    // [private helper methods]

    private static __createProtocol(): IpcProtocol {
        /**
         * We register a channel listener on {@link IpcChannel.DataChannel} into
         * our own {@link ipcRenderer} and every time we receive data we wrap it 
         * with data buffer.
         */
        const nodeEmitter = new NodeEventEmitter<DataBuffer>(
            ipcRenderer, 
            IpcChannel.DataChannel, 
            (event, data) => {
                console.log(data instanceof Uint8Array);
                return DataBuffer.wrap(data);
            },
        );

        IpcClient._disposable.register(nodeEmitter);
        return new IpcProtocol(ipcRenderer, nodeEmitter.registerListener);
    }
}
