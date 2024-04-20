import { URI } from "src/base/common/files/uri";
import { FileItem } from "src/workbench/services/fileTree/fileItem";

/**
 * {@link AllCommands}
 * {@link AllCommandsDescriptions}
 * {@link AllCommandsArgumentsTypes}
 * {@link AllCommandsReturnTypes}
 */

/**
 * @description Represents a set of predefined ID that can be executed by the 
 * {@link CommandService}.
 * 
 * @note Those commands are ensured DEFINED in the program. Safely to call these
 *       commands through {@link CommandService}.
 * @note When you are modifying commands to this enumeration, MAKE SURE:
 *  1. You actually registered this command into the {@link CommandRegistrant}.
 *  2. You also update the following entries:
 *      - {@link AllCommandsDescriptions},
 *      - {@link AllCommandsArgumentsTypes} and
 *      - {@link AllCommandsReturnTypes}.
 * 
 * @note This enumeration ensures type safety by allowing only valid IDs for
 *       `executeCommand`.
 * 
 * @example
 * ```ts
 * // Example of executing a reload window command
 * commandService.executeCommand(AllCommands.reloadWindow);
 * ```
 */
export const enum AllCommands {
    
    // [workbench]

    alertError       = 'alertError',
    toggleDevTool    = 'toggle-develop-tool',
    reloadWindow     = 'reload-window',
    closeApplication = 'close-application',

    // [FileTree]

    newFile   = 'newFile', // TODO
    newFolder = 'newFolder', // TODO
    fileCut   = 'fileCut',
    fileCopy  = 'fileCopy',
    filePaste = 'filePaste',
    fileMove  = 'fileMove', // TODO
}

/**
 * @description Provides descriptions for each command defined in {@link AllCommands}. 
 * These descriptions can be used for UI tooltips, logs, or any other feature 
 * that requires a human-readable explanation.
 */
export const AllCommandsDescriptions: { [key in AllCommands]: string } = {

    [AllCommands.alertError]:       'Displays error messages in a popup notification.',
    [AllCommands.toggleDevTool]:    'Toggle the developer tool of the whole application.',
    [AllCommands.reloadWindow]:     'Reload the browser entirely.',
    [AllCommands.closeApplication]: 'Close the current window.',

    [AllCommands.newFile]:          '',
    [AllCommands.newFolder]:        '',
    [AllCommands.fileCut]:          'Sets selected files in the file tree as ready to be cut.',
    [AllCommands.fileCopy]:         'Sets selected files in the file tree as ready to be copied.',
    [AllCommands.filePaste]:        'Paste the given targets to the file tree.',
    [AllCommands.fileMove]:         'Moves selected explorer files.',
};

/**
 * @description Maps each command defined in {@link AllCommands} to its 
 * respective argument types. 
 * 
 * @note This type mapping ensures that each command is called with the correct 
 * set of arguments, providing compile-time safety and clarity on what arguments 
 * are expected for each command.
 * 
 * @example
 * ```ts
 * // No arguments are needed for these commands, so an empty array is used.
 * const argsForToggleDevTool: AllCommandsArgumentsTypes[AllCommands.toggleDevTool] = [];
 * commandService.executeCommand(AllCommands.toggleDevTool, ...argsForToggleDevTool);
 * ```
 */
export type AllCommandsArgumentsTypes = {
    
    [AllCommands.alertError]      : [reporter: string, error: Error];
    [AllCommands.toggleDevTool]   : [];
    [AllCommands.reloadWindow]    : [];
    [AllCommands.closeApplication]: [];
    
    [AllCommands.newFile]  : [];
    [AllCommands.newFolder]: [];
    [AllCommands.fileCut]  : [];
    [AllCommands.fileCopy] : [];
    [AllCommands.filePaste]: [destination: FileItem, destinationIdx?: number, resources?: URI[] | FileItem[]];
    [AllCommands.fileMove] : [];
};

/**
 * @description Defines the return types for each command in {@link AllCommands}. 
 * @note This provides type safety for the outcomes of command executions. 
 * 
 * @example
 * ```ts
 * async function toggleDevTools() {
 *   await commandService.executeCommand(AllCommands.toggleDevTool);
 *   // Since the return type is void, there's no value to work with after execution
 * }
 * ```
 */
export type AllCommandsReturnTypes = {
    
    [AllCommands.alertError]      : void;
    [AllCommands.toggleDevTool]   : void;
    [AllCommands.reloadWindow]    : void;
    [AllCommands.closeApplication]: void;

    [AllCommands.newFile]  : void;
    [AllCommands.newFolder]: void;
    [AllCommands.fileCut]  : void;
    [AllCommands.fileCopy] : void;
    [AllCommands.filePaste]: void;
    [AllCommands.fileMove] : void;
};