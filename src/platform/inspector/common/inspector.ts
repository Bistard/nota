import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import type { IpcChannel } from "src/platform/ipc/common/channel";
import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IMainInspectorService = createService<IMainInspectorService>('main-inspector-service');
export const IBrowserInspectorService = createService<IBrowserInspectorService>('browser-inspector-service');

/**
 * An interface only for {@link MainInspectorService}.
 */
export interface IMainInspectorService extends IService {
    start(window: IWindowInstance): void;
    stop(window: IWindowInstance): void;
}

export interface IBrowserInspectorService extends IService {
    /**
     * @description Once invoked, will listen to the following channel:
     *  1. {@link IpcChannel.InspectorReady}
     *  2. {@link IpcChannel.InspectorClose}
     * @note Can only be invoked once.
     */
    startListening(): void;
}

/**
 * Indicates what type of data the inspector window might listens to the 
 * associated renderer process.
 */
export const enum InspectorDataType {
    Configuration = 'Config',
    ContextKey    = 'Context',
    Command       = 'Command',
    Shortcut      = 'Shortcut',
    Color         = 'Color',
    Menu          = 'Menu',
}

export type InspectorData = {
    key: string;
    value?: any;
    children?: InspectorData[];

    // help to distinguish color item
    isColor?: true;
};
