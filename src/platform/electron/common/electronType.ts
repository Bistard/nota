
/*******************************************************************************
 * These are the electron related APIs we exposed from the preload.js.
 * (Electron document copied from 17.x)
 ******************************************************************************/

import { ProcessMemoryInfo } from "electron";
import { INodeProcess, IProcessEnvironment } from "src/base/common/process";
import { Callable } from "src/base/common/utilities/type";

/**
 * @link https://electronjs.org/docs/api/structures/ipc-renderer-event
 */
export interface IIpcRendererEvent extends Event {

	/**
	 * The IIpcRenderer instance that emitted the event originally.
	 */
	readonly sender: IIpcRenderer;

	/**
	 * The webContents.id that sent the message, you can call 
	 * `event.sender.sendTo(event.senderId, ...)` to reply to the message, see 
	 * `ipcRenderer.sendTo` for more information. This only applies to messages 
	 * sent from a different renderer. Messages sent directly from the main 
	 * process set event.senderId to 0.
	 */
	readonly senderId: number;
}

/**
 * @link https://www.electronjs.org/docs/latest/api/ipc-renderer
 */
export interface IIpcRenderer {

	/**
	 * Listens to the channel, when a new message arrives listener would be 
	 * called with `listener(event, args...)`.
	 */
	on(channel: string, listener: (event: IIpcRendererEvent, ...args: any[]) => void): this;

	/**
	 * Adds a one time `listener` function for the event. This `listener` is invoked
	 * only the next time a message is sent to `channel`, after which it is removed.
	 */
	once(channel: string, listener: (event: IIpcRendererEvent, ...args: any[]) => void): this;

	/**
	 * Removes the specified `listener` from the listener array for the specified
	 * `channel`.
	 */
	removeListener(channel: string, listener: (...args: any[]) => void): this;

	/**
	 * Send an asynchronous message to the main process via `channel`, along with
	 * arguments. Arguments will be serialized with the Structured Clone Algorithm,
	 * just like `window.postMessage`, so prototype chains will not be included.
	 * Sending Functions, Promises, Symbols, WeakMaps, or WeakSets will throw an
	 * exception.
	 *
	 * > **NOTE:** Sending non-standard JavaScript types such as DOM objects or special
	 * Electron objects will throw an exception.
	 *
	 * Since the main process does not have support for DOM objects such as
	 * `ImageBitmap`, `File`, `DOMMatrix` and so on, such objects cannot be sent over
	 * Electron's IPC to the main process, as the main process would have no way to
	 * decode them. Attempting to send such objects over IPC will result in an error.
	 *
	 * The main process handles it by listening for `channel` with the `ipcMain`
	 * module.
	 *
	 * If you need to transfer a `MessagePort` to the main process, use
	 * `ipcRenderer.postMessage`.
	 *
	 * If you want to receive a single response from the main process, like the result
	 * of a method call, consider using `ipcRenderer.invoke`.
	 */
	send(channel: string, ...args: any[]): void;

	/**
	 * Resolves with the response from the main process.
	 *
	 * Send a message to the main process via `channel` and expect a result
	 * asynchronously. Arguments will be serialized with the Structured Clone
	 * Algorithm, just like `window.postMessage`, so prototype chains will not be
	 * included. Sending Functions, Promises, Symbols, WeakMaps, or WeakSets will throw
	 * an exception.
	 *
	 * > **NOTE:** Sending non-standard JavaScript types such as DOM objects or special
	 * Electron objects will throw an exception.
	 *
	 * Since the main process does not have support for DOM objects such as
	 * `ImageBitmap`, `File`, `DOMMatrix` and so on, such objects cannot be sent over
	 * Electron's IPC to the main process, as the main process would have no way to
	 * decode them. Attempting to send such objects over IPC will result in an error.
	 *
	 * The main process should listen for `channel` with `ipcMain.handle()`.
	 *
	 * If you do not need a response to the message, consider using `ipcRenderer.send`.
	 */
	invoke(channel: string, ...args: any[]): Promise<any>;
}

/**
 * This is the interface for the `process` that is exposed from the preload.js.
 */
export interface ISandboxProcess extends INodeProcess {
	/**
	 * The process.platform property returns a string identifying the operating system platform
	 * on which the Node.js process is running.
	 */
	readonly platform: string;

	/**
	 * The process.arch property returns a string identifying the CPU architecture
	 * on which the Node.js process is running.
	 */
	readonly arch: string;

	/**
	 * The type will always be `renderer`.
	 */
	readonly type: string;

	/**
	 * Whether the process is sandboxed or not.
	 */
	readonly sandboxed: boolean;

	/**
	 * The `process.pid` property returns the PID of the process.
	 *
	 * @deprecated this property will be removed once sandbox is enabled.
	 *
	 * // TODO remove this property when sandbox is on
	 */
	readonly pid: number;

	/**
	 * A list of versions for the current node.js/electron configuration.
	 */
	readonly versions: { [key: string]: string | undefined; };

	/**
	 * The process.env property returns an object containing the user environment.
	 */
	readonly env: IProcessEnvironment;

	/**
	 * The `execPath` will be the location of the executable of this application.
	 */
	readonly execPath: string;

	/**
	 * A listener on the process. Only a small subset of listener types are allowed.
	 */
	on: (type: string, callback: Callable<any[], any>) => void;

	/**
	 * The current working directory of the process.
	 */
	cwd: () => string;

	/**
	 * Resolves with a ProcessMemoryInfo
	 *
	 * Returns an object giving memory usage statistics about the current process. Note
	 * that all statistics are reported in Kilobytes. This api should be called after
	 * app ready.
	 *
	 * Chromium does not provide `residentSet` value for macOS. This is because macOS
	 * performs in-memory compression of pages that haven't been recently used. As a
	 * result the resident set size value is not what one would expect. `private`
	 * memory is more representative of the actual pre-compression memory usage of the
	 * process on macOS.
	 */
	getProcessMemoryInfo: () => Promise<ProcessMemoryInfo>;

	/**
	 * @deprecated **NOTE** DO NOT USE THIS, API IS NOT EXPOSED.
	 * Returns a process environment that includes all shell environment variables even if
	 * the application was not started from a shell / terminal / console.
	 *
	 * There are different layers of environment that will apply:
	 * - `process.env`: this is the actual environment of the process before this method
	 * - `shellEnv`   : if the program was not started from a terminal, we resolve all shell
	 *                  variables to get the same experience as if the program was started from
	 *                  a terminal (Linux, macOS)
	 * - `userEnv`    : this is instance specific environment, e.g. if the user started the program
	 *                  from a terminal and changed certain variables
	 *
	 * The order of overwrites is `process.env` < `shellEnv` < `userEnv`.
	 */
	shellEnv?(): Promise<IProcessEnvironment>;
}

export interface IWebFrame {

	/**
	 * Changes the zoom level to the specified level. The original size is 0 and each
	 * increment above or below represents zooming 20% larger or smaller to default
	 * limits of 300% and 50% of original size, respectively. The formula for this is
	 * `scale := 1.2 ^ level`.
	 *
	 * > **NOTE**: The zoom policy at the Chromium level is same-origin, meaning that
	 * the zoom level for a specific domain propagates across all instances of windows
	 * with the same domain. Differentiating the window URLs will make zoom work
	 * per-window.
	 */
	setZoomLevel(level: number): void;

	/**
     * The current zoom level.
     */
	getZoomLevel(): number;
}