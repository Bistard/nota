import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { ILogService } from "src/base/common/logger";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IContextService } from "src/platform/context/common/contextService";
import { ipcRenderer, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { IBrowserInspectorService, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IpcChannel } from "src/platform/ipc/common/channel";

export class BrowserInspectorService implements IBrowserInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    private _lifecycle?: DisposableManager;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IContextService private readonly contextService: IContextService,
    ) {}

    // [public methods]

    public startListening(): void {
        ipcRenderer.on(IpcChannel.InspectorReady, () => this.start());
        ipcRenderer.on(IpcChannel.InspectorClose, () => this.stop());
    }

    public start(): void {
        if (this._lifecycle) {
            this.logService.warn('BrowserInspectorService', 'Cannot start listening to inspector window twice.');
            return;
        }
        this._lifecycle = new DisposableManager();

        // configuration init data
        // const entireConfiguration = this.configurationService.get(undefined);
        // ipcRenderer.send(IpcChannel.InspectorDataSync, WIN_CONFIGURATION.windowID, {
        //     type: InspectorDataType.Configuration,
        //     data: entireConfiguration,
        // });

        this._lifecycle.register(this.__registerChangeListeners());
    }

    public stop(): void {
        this._lifecycle?.dispose();
        this._lifecycle = undefined;
    }

    // [private methods]

    private __registerChangeListeners(): IDisposable {
        const listeners = new DisposableManager();

        // TODO: register -> listeners for the followup updates

        return listeners;
    }
}