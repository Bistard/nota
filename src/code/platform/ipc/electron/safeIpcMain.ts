import { ipcMain as UnsafeIpcMain } from "electron";
import { ErrorHandler } from "src/base/common/error";
import { ChannelType } from "src/code/platform/ipc/common/channel";

export type IpcMainEventCallback = (event: Electron.IpcMainEvent, ...args: any[]) => void;
export type IpcMainInvokeEventCallback = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<any>;

/**
 * An interface only for {@link SafeIpcMain}. It mocks the APIs from 
 * {@link Electron.ipcMain}.
 */
export interface ISafeIpcMain {
    
    /**
     * Adds a handler for an `invoke`able IPC. This handler will be called 
     * whenever a renderer calls `ipcRenderer.invoke(channel, ...args)`.
     *
     * If `listener` returns a Promise, the eventual result of the promise will 
     * be returned as a reply to the remote caller. Otherwise, the return value 
     * of the listener will be used as the value of the reply.
     *
     * The `event` that is passed as the first argument to the handler is the 
     * same as that passed to a regular event listener. It includes information
     * about which WebContents is the source of the invoke request.
     *
     * Errors thrown through `handle` in the main process are not transparent as 
     * they are serialized and only the `message` property from the original 
     * error is provided to the renderer process.
     */
    handle(channel: string, listener: IpcMainInvokeEventCallback): this;
    
    /**
     * Handles a single `invoke`able IPC message, then removes the listener. See
     * `ipcMain.handle(channel, listener)`.
     */
    handleOnce(channel: string, listener: IpcMainInvokeEventCallback): this;
    
    /**
     * Listens to `channel`, when a new message arrives `listener` would be called with
     * `listener(event, args...)`.
     */
    on(channel: string, listener: IpcMainEventCallback): this;
    
    /**
     * Adds a one time `listener` function for the event. This `listener` is invoked
     * only the next time a message is sent to `channel`, after which it is removed.
     */
    once(channel: string, listener: IpcMainEventCallback): this;
    
    /**
     * Removes listeners of the specified `channel`.
     */
    removeAllListeners(channel?: string): this;
    
    /**
     * Removes any handler for `channel`, if present.
     */
    removeHandler(channel: string): this;
    
    /**
     * Removes the specified `listener` from the listener array for the specified
     * `channel`.
     */
    removeListener(channel: string, listener: (...args: any[]) => void): this;
}

/**
 * @description Essentially just a wrapper class upon the {@link Electron.ipcMain}
 * with additional channel naming validation. The channel sending from main 
 * process will be validate with correct channel name.
 * 
 * @note Implemented using signleton. Get the instance by {@link SafeIpcMain.instance()}.
 */
export class SafeIpcMain implements ISafeIpcMain {
    
    // [field]
    
    private static _instance?: SafeIpcMain;
    private readonly _listeners = new WeakMap<IpcMainEventCallback, IpcMainEventCallback>();

    // [constructor]

    private constructor() {}

    // [public static methods]

    public static get instance(): SafeIpcMain {
        if (!SafeIpcMain._instance) {
            SafeIpcMain._instance = new SafeIpcMain();
        }
        return SafeIpcMain._instance;
    }

    // [public methods]

    public on(channel: ChannelType, listener: IpcMainEventCallback): this {
        const wrappedCallback: IpcMainEventCallback = (event, ...args) => {
            if (this.__validate(channel)) {
                listener(event, ...args);
            }
        }

        this._listeners.set(listener, wrappedCallback);
        UnsafeIpcMain.on(channel, wrappedCallback);

        return this;
    }

    public once(channel: ChannelType, listener: IpcMainEventCallback): this {
        UnsafeIpcMain.once(channel, (event, ...args) => {
            if (this.__validate(channel)) {
                listener(event, ...args);
            }
        });
        return this;
    }

    public handle(channel: ChannelType, listener: IpcMainInvokeEventCallback): this {
        UnsafeIpcMain.handle(channel, (event, ...args) => {
            if (this.__validate(channel)) {
				return listener(event, ...args);
			}
			return Promise.reject(`Invalid channel '${channel}'`);
        });
        return this;
    }

    public handleOnce(channel: string, listener: IpcMainInvokeEventCallback): this {
        UnsafeIpcMain.handleOnce(channel, (event, ...args) => {
            if (this.__validate(channel)) {
                return listener(event, ...args);
            }
            return Promise.reject(`Invalid channel '${channel}'`);
        });
        return this;
    }

    public removeListener(channel: ChannelType, listener: IpcMainEventCallback): this {
        const wrappedListener = this._listeners.get(listener);
        if (wrappedListener) {
            UnsafeIpcMain.removeListener(channel, wrappedListener);
            this._listeners.delete(wrappedListener);
        }
        return this;
    }

    public removeAllListeners(channel?: string): this {
        UnsafeIpcMain.removeAllListeners(channel);
        return this;
    }

    public removeHandler(channel: ChannelType): this {
        UnsafeIpcMain.removeHandler(channel);
        return this;
    }

    // [private helper methods]

    private __validate(channel: ChannelType): boolean {
        if (!channel || !channel.startsWith('nota:')) {
            ErrorHandler.onUnexpectedError(`Refused to handle ipcMain event for channel '${channel}'.`);
            return false;
        }
        return true;
    }
}