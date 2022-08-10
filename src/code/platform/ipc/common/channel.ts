
/**
 * 
 */
export const enum IpcChannel {
    Log = 'nota:log',
    WriteFile = 'nota:writeFile',
    ReadFile = 'nota:readFile',
    
    ToggleDevTools = 'nota:toggleDevTools',
    OpenDevTools = 'nota:openDevTools',
    CloseDevTools = 'nota:closeDevTools',
    ReloadWindow = 'nota:reload',
}

/**
 * 
 */
export type ChannelType = IpcChannel | string;