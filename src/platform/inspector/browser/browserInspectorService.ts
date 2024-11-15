import { DisposableManager } from "src/base/common/dispose";
import { ipcRenderer } from "src/platform/electron/browser/global";
import { IBrowserInspectorService } from "src/platform/inspector/common/inspector";
import { IpcChannel } from "src/platform/ipc/common/channel";

export class BrowserInspectorService implements IBrowserInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    private _lifecycle: DisposableManager;

    // [constructor]

    constructor() {
        this._lifecycle = new DisposableManager();
    }

    // [public methods]

    public startListening(): void {
        ipcRenderer.on(IpcChannel.InspectorReady, () => this.start());
        ipcRenderer.on(IpcChannel.InspectorClose, () => this.stop());
    }

    public start(): void {
        
        // TODO: init -> send all the initial data for rendering

        // TODO: register -> listeners for the followup updates
    }

    public stop(): void {
        this._lifecycle.dispose();
        this._lifecycle = new DisposableManager();
    }

    // [private methods]

}