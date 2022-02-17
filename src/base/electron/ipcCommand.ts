

/**
 * @enum A series of enum for ipc communication. The main reason having this 
 * enum is only for reducing long string parameter from optimization perspective.
 */
export const enum IpcCommand {

    Test = '0',
    OpenDevelopTool = '1',
    ReloadWindow = '2',
    ErrorInWindow = '3',

    AlwaysOnTopOn = '4',
    AlwaysOnTopOff = '5',
    
}