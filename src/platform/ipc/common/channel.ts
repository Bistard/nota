import { Register } from "src/base/common/event";
import { ProxyChannel } from "src/platform/ipc/common/proxy";

/**
 * Built-in IPC channel names.
 */
export const enum IpcChannel {
    // Channel used for arbitrary data sending /receiving between processes.
    DataChannel = 'nota:data',
    Connect = 'nota:connect',
    Disconnect = 'nota:disconnect',

    // micro-service channel
    Logger = 'nota:mainLogger',
    DiskFile = 'nota:diskFile',
    Host = 'nota:host',
    Dialog = 'nota:dialog',
    Menu = 'nota:menu',
    Encryption = 'nota:encryption',

    // main process direct communication to renderer process
    rendererAlertError = 'nota:rendererAlertError',
    rendererRunCommand = 'nota:rendererRunCommand',
    
    // inspector window channel
    InspectorReady       = 'nota:inspectorReady',
    InspectorClose       = 'nota:inspectorClose',
    InspectorDataSync    = 'nota:inspectorDataSync',
    InspectorDataModify  = 'nota:inspectorDataModify',

    // Main process internal usage (not actually went through IPC), no need for a `nota:` prefix.
    WindowMaximized = 'window-maximized',
    WindowUnMaximized = 'window-unMaximized',
    WindowFocused = 'window-focused',
    WindowBlurred = 'window-blurred',
    WindowEnterFullScreen = 'window-enter-full-screen',
    WindowLeaveFullScreen = 'window-leave-full-screen',
    windowOnBeforeUnload = 'nota:windowOnBeforeUnload',
}

/**
 * Except built-in channels, you still may use any names in string as a channel
 * name for extension purposes.
 */
export type ChannelType = IpcChannel | string;

/**
 * A server channel is an abstraction over a collection of commands and events. 
 * 
 * You are able to invoke these commands by given a name and a corresponding 
 * argument. It always returns a promise (even if the command does not return a 
 * promise) that resolves a maximum one return value.
 * 
 * If you want to pass multiple arguments, use array instead.
 * 
 * Similar to the command, you can register an event listener from the channel. 
 * It returns an event register for registration.
 * 
 * You might want to use {@link ProxyChannel.wrapService} to generate a server 
 * channel from a given microservice.
 * 
 * The first parameter gives the opportunity to notify the server channel who is
 * calling the command.
 */
export interface IServerChannel {
    callCommand<T>(id: string, command: string, arg?: any[]): Promise<T>;
    registerListener<T>(id: string, event: string, arg?: any[]): Register<T>;
}

/**
 * A channel works the same as {@link IServerChannel} except that it does not
 * require an ID.
 */
export interface IChannel {
    callCommand<T>(command: string, arg?: any): Promise<T>;
    registerListener<T>(event: string, arg?: any): Register<T>;
}