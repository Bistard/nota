

/**
 * @enum A series of enum for ipc communication. The main reason having this 
 * enum is only for reducing long string parameter from optimization perspective.
 */
export const enum IpcCommand {

    Test =                  '0',
    ToggleDevelopTool =       '1',
    ReloadWindow =          '2',
    ErrorInWindow =         '3',

    AlwaysOnTopOn =         '4',
    AlwaysOnTopOff =        '5',
    EnterFullScreen =       '6',
    LeaveFullScreen =       '7',

    WindowMaximize =        '8',
    WindowUnmaximize =      '9',
    WindowRestore =         '10',
    WindowMinimize =        '11',
    WindowClose =           '12',
    WindowBlur =            '13',

    AboutToClose =          '14',
    RendererReadyForClose = '15',

    OpenDirectory =         '16',

    WindowResize =          '17',
}