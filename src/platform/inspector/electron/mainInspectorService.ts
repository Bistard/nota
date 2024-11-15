import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { SafeIpcMain } from "src/platform/ipc/electron/safeIpcMain";
import { IpcChannel } from "src/platform/ipc/common/channel";

export const IMainInspectorService = createService<IMainInspectorService>('main-inspector-service');

/**
 * An interface only for {@link MainInspectorService}.
 */
export interface IMainInspectorService extends IService {
    start(window: IWindowInstance): void;
    stop(window: IWindowInstance): void;
}

export class MainInspectorService implements IMainInspectorService {

    declare _serviceMarker: undefined;

    // [field]

    // [constructor]

    constructor() {
    }

    // [public methods]

    public start(window: IWindowInstance): void {
        
        SafeIpcMain.instance.on(IpcChannel.InspectorReady, (e) => {
            console.log('main: inspector ready');
        });

    }

    public stop(window: IWindowInstance): void {
        
    }

    // [private methods]

}