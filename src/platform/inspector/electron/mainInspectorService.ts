import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { SafeIpcMain } from "src/platform/ipc/electron/safeIpcMain";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ILogService } from "src/base/common/logger";
import { IMainWindowService } from "src/platform/window/electron/mainWindowService";
import { IMainInspectorService, InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { INSPECTOR_HTML } from "src/platform/window/common/window";
import { Event } from "src/base/common/event";
import { assert } from "src/base/common/utilities/panic";

export class MainInspectorService implements IMainInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    /**
     * Mapping from inspectorWindowID to ownerWindowID
     */
    private readonly _activeInspectors: Map<number, number>;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IMainWindowService private readonly mainWindowService: IMainWindowService,
    ) {
        this._activeInspectors = new Map();

        /**
         * Notify READY to the associated render process that the inspector is
         * ready to listen to the changes with type of `listenToDataType`.
         */
        SafeIpcMain.instance.on(IpcChannel.InspectorReady, (_, inspectorID: number, listenToDataType: InspectorDataType) => {
            const ownerWindow = this.getInspectorWindowOwner(inspectorID);
            ownerWindow.sendIPCMessage(IpcChannel.InspectorReady, listenToDataType);
        });

        /**
         * Notify CLOSE to the associated render process that the inspector is
         * no longer listening.
         */
        SafeIpcMain.instance.on(IpcChannel.InspectorClose, (_, inspectorID: number) => {
            const ownerWindow = this.getInspectorWindowOwner(inspectorID);
            ownerWindow.sendIPCMessage(IpcChannel.InspectorClose);
        });

        // receive DATA from the renderer process
        SafeIpcMain.instance.on(IpcChannel.InspectorDataSync, (_, ownerID: number, data: InspectorData[]) => {
            const ownerWindow = assert(mainWindowService.getWindowByID(ownerID));
            const inspectorWindow = this.getInspectorWindowByOwnerID(ownerWindow.id);
            
            /**
             * No inspectors but we still received IPC message somehow, we tell 
             * the owner to stop doing it.
             */
            if (!inspectorWindow) {
                ownerWindow.sendIPCMessage(IpcChannel.InspectorClose);
                return;
            }

            // transfer the latest data to the inspector window
            inspectorWindow.sendIPCMessage(IpcChannel.InspectorDataSync, data);
        });
    }

    // [public methods]

    public async start(ownerID: number): Promise<void> {
        if (this._activeInspectors.has(ownerID)) {
            this.logService.warn('MainInspectorService', `Cannot start inspector window once the same owner window (${ownerID}) twice.`);
            return;
        }

        const window = await this.mainWindowService.open({
            applicationName: `Inspector Process (associated with owner Window: ${ownerID})`,
            CLIArgv:  { _: [] }, // empty
            loadFile: INSPECTOR_HTML,
            displayOptions: {
                width: 400,
                height: 600,
                resizable: true,
                frameless: false,
                alwaysOnTop: true,
            },
            "open-devtools": false,
            hostWindow: ownerID,
            ownerWindow: ownerID,
        });

        this._activeInspectors.set(window.id, ownerID);
        Event.once(window.onDidClose)(() => {
            this.stop(window.id);
        });
    }

    public stop(inspectorID: number): void {
        if (!this._activeInspectors.has(inspectorID)) {
            return;
        }
        this._activeInspectors.delete(inspectorID);
        const inspectorWindow = this.mainWindowService.getWindowByID(inspectorID);
        if (!inspectorWindow || inspectorWindow.isClosed()) {
            return;
        }
        this.mainWindowService.closeWindowByID(inspectorID);
    }

    public getInspectorWindowByID(inspectorID: number): IWindowInstance | undefined {
        return this._activeInspectors.has(inspectorID) ? this.mainWindowService.getWindowByID(inspectorID) : undefined;
    }

    public getInspectorWindowOwner(inspectorID: number): IWindowInstance {
        const ownerID = assert(this._activeInspectors.get(inspectorID));
        return assert(this.mainWindowService.getWindowByID(ownerID));
    }

    public getInspectorWindowByOwnerID(windowID: number): IWindowInstance | undefined {
        for (const [inspectorID, ownerID] of this._activeInspectors) {
            if (ownerID === windowID) {
                return this.mainWindowService.getWindowByID(inspectorID);
            }
        }
        return undefined;
    }

    public isInspectorWindow(id: number): boolean {
        return this._activeInspectors.has(id);
    }
}