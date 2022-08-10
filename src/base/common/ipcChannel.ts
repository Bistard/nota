

/**
 * @enum A series of enum for ipc communication. 
 * 
 * The main reason having this enum is for: 
 *      0. Globally usage purpose.
 *      1. Prevent potential invalid channel.
 *      2. Less string copy.
 * @deprecated
 */
export const enum IpcChannel {

    Test =                  '0',
    ToggleDevelopTool =     '1',
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