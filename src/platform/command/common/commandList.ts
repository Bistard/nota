
/**
 * @description Represents the set of predefined command identifiers that can be 
 * executed by the {@link CommandService}.
 * 
 * @note Those commands are ensured DEFINED in the program. Safely to call these
 *       commands through {@link CommandService}.
 * @note When adding new commands to this enumeration, MAKE SURE the following
 *       types {@link AllCommandsArgumentsTypes} and {@link AllCommandsReturnTypes}
 *       are also updated.
 * @note This enumeration is used to provide a strongly typed way of referring 
 *       to commands, ensuring that only valid command identifiers are used when 
 *       invoking `executeCommand`.
 * 
 * @example
 * ```ts
 * // Example of executing a reload window command
 * commandService.executeCommand(AllCommands.reloadWindow);
 * ```
 */
export const enum AllCommands {
    
    // [workbench]

    toggleDevTool = 'toggle-develop-tool',
    reloadWindow = 'reload-window',
    closeApplication = 'close-application',

    // [end]
}

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
    [AllCommands.toggleDevTool]: [];
    [AllCommands.reloadWindow]: [];
    [AllCommands.closeApplication]: [];
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
    [AllCommands.toggleDevTool]: void;
    [AllCommands.reloadWindow]: void;
    [AllCommands.closeApplication]: void;
};