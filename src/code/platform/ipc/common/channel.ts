
/**
 * Built-in IPC channel names.
 */
export const enum IpcChannel {
    /** Channel used for arbitrary data sending /receiving between processes. */
    DataChannel = 'nota:data',
    Connect = 'nota:connect',
    Disconnect = 'nota:disconnect',

    Log = 'nota:log',
    WriteFile = 'nota:writeFile',
    ReadFile = 'nota:readFile',
    
    ToggleDevTools = 'nota:toggleDevTools',
    OpenDevTools = 'nota:openDevTools',
    CloseDevTools = 'nota:closeDevTools',
    ReloadWindow = 'nota:reload',
}

/**
 * Except built-in channels, you still may use any names in string for extension
 * purpose.
 */
export type ChannelType = IpcChannel | string;