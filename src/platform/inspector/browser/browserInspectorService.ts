import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { InitProtector } from "src/base/common/error";
import { isObject } from "src/base/common/utilities/type";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IContextService } from "src/platform/context/common/contextService";
import { ipcRenderer, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { IBrowserInspectorService, InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IpcChannel } from "src/platform/ipc/common/channel";

export class BrowserInspectorService implements IBrowserInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    private readonly _initProtector: InitProtector;
    private _lifecycle: DisposableManager;
    private _currentListenTo?: InspectorDataType;

    // [constructor]

    constructor(
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IContextService private readonly contextService: IContextService,
    ) {
        this._lifecycle = new DisposableManager();
        this._initProtector = new InitProtector();
    }

    // [public methods]

    public startListening(): void {
        this._initProtector.init('[BrowserInspectorService] Cannot initialize twice').unwrap();
        ipcRenderer.on(IpcChannel.InspectorReady, (e, listenToDataType: InspectorDataType) => {
            this.startListenTo(listenToDataType);
        });
        ipcRenderer.on(IpcChannel.InspectorClose, () => {
            this.stopListenTo();
        });
    }

    // [private methods]

    private startListenTo(listenToDataType: InspectorDataType): void {
        
        // duplicate listens to the same data, do nothing
        if (this._currentListenTo === listenToDataType) {
            return;
        }

        // clear the previous listeners
        this.stopListenTo();
        this._currentListenTo = listenToDataType;
        
        // send init data to the inspector for initial rendering
        this.__sendInitData(listenToDataType);

        // register listener for the later data changes
        this._lifecycle.register(this.__registerChangeListeners(listenToDataType));
    }

    private stopListenTo(): void {
        this._lifecycle.dispose();
        this._lifecycle = new DisposableManager();
        this._currentListenTo = undefined;
    }

    // [private methods]

    private __sendInitData(listenToDataType: InspectorDataType): void {
        const data = this.__transformData(listenToDataType);
        ipcRenderer.send(IpcChannel.InspectorDataSync, WIN_CONFIGURATION.windowID, data);
    }

    private __transformData(listenToDataType: InspectorDataType): InspectorData[] {
        if (listenToDataType === InspectorDataType.Configuration) {
            return transformConfigurationToData(this.configurationService.get(undefined));
        } 
        // TODO: other types
        else {
            return [];
        }
    }

    private __registerChangeListeners(listenToDataType: InspectorDataType): IDisposable {
        const listeners = new DisposableManager();

        // TODO: register -> listeners for the followup updates

        return listeners;
    }
}

function transformConfigurationToData(config: object): InspectorData[] {
    function buildData(obj: any): InspectorData[] {
        return Object.entries(obj).map(([key, value]) => {
            if (isObject(value)) {
                return { key, children: buildData(value), };
            } else {
                return { key, value, };
            }
        });
    }
    return buildData(config);
}