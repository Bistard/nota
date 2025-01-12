import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import type { IpcChannel } from "src/platform/ipc/common/channel";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { Disposable } from "src/base/common/dispose";

export const IMainInspectorService = createService<IMainInspectorService>('main-inspector-service');
export const IBrowserInspectorService = createService<IBrowserInspectorService>('browser-inspector-service');

/**
 * An interface only for {@link MainInspectorService}.
 */
export interface IMainInspectorService extends IService {

    /**
     * @description Starts a new inspector window for the specified owner window.
     * @param owner The ID of the owner window for which the inspector window 
     *              will be created. The lifecycle of the inspector window will 
     *              be bonded with the owner window.
     */
    start(owner: number): Promise<void>;
    
    /**
     * @description Stops and closes the inspector window associated with the 
     * specified inspector ID.
     * @param inspectorID The ID of the inspector window to stop and close.
     */
    stop(inspectorID: number): void;

    getInspectorWindowByID(windowID: number): IWindowInstance | undefined;
    getInspectorWindowByOwnerID(windowID: number): IWindowInstance | undefined;
    getInspectorWindowOwner(inspectorID: number): IWindowInstance;
    isInspectorWindow(windowID: number): boolean;
}

export interface IBrowserInspectorService extends IService, Disposable {
    /**
     * @description Once invoked, will listen to the following channel:
     *  1. {@link IpcChannel.InspectorReady}
     *  2. {@link IpcChannel.InspectorClose}
     * @note Can only be invoked once.
     */
    startListening(): void;
    isListening(): boolean;
    stopListenTo(): void;
}

/**
 * Indicates what type of data the inspector window might listens to the 
 * associated renderer process.
 */
export const enum InspectorDataType {
    Configuration = 'Config',
    Status        = 'Status',
    ContextKey    = 'Context',
    Command       = 'Command',
    Shortcut      = 'Shortcut',
    Color         = 'Color',
    Menu          = 'Menu',
}

export type InspectorData = {
    readonly key: string;
    readonly value?: any;
    readonly children?: InspectorData[];

    readonly collapsedByDefault?: boolean;
    
    readonly id?: string; // a unique identifier

    readonly isColor?: true;    // help to distinguish color item
    readonly isEditable?: true; // mark as editable
};
