/*******************************************************************************
 * Electron's main process is a Node.js environment that has full operating 
 * system access. On top of Electron modules, you can also access Node.js 
 * built-ins, as well as any packages installed via npm. 
 * 
 * On the other hand, renderer processes run web pages and do not run Node.js by 
 * default for security reasons. To bridge Electron's different process types 
 * together, we will need to use a special script called a preload.
 ******************************************************************************/

/*******************************************************************************
 * Sketch Map                 A  B  C ...
 *     of                     |  |  |  |          not direct access to nodejs
 * preload.js                ------------                      |
 *                           |   main   |                ------------
 *                           |          |                | renderer |
 *                           |  process |\             / ------------
 *                           ------------ \           /
 *                                         ----------- 
 *                                         | preload | —— D, E, NodeJS...
 * A,B,C,D,E are IPC channels              ----------- 
 ******************************************************************************/

(function () {
	'use strict';

	const { contextBridge, ipcRenderer } = require('electron');

	const myIpcRenderer = {
		/**
		 * @param {string} channel
		 * @param {any[]} args
		 */
		send(channel, ...args) {
			ipcRenderer.send(channel, ...args);
		},

		/**
		* @param {string} channel
		* @param {(event: IpcRendererEvent, ...args: any[]) => void} listener
		* @returns {IpcRenderer}
		*/
		on(channel, listener) {
			ipcRenderer.on(channel, listener);
			return this;
		},

		/**
		* @param {string} channel
		* @param {(event: IpcRendererEvent, ...args: any[]) => void} listener
		* @returns {IpcRenderer}
		*/
		removeListener(channel, listener) {
			ipcRenderer.removeListener(channel, listener);
			return this;
		}
	};

	const myProcess = {
		get platform() { return process.platform; },
		get arch() { return process.arch; },
		get env() { return { ...process.env }; },
		get pid() { return process.pid; },
		get versions() { return process.versions; },
		get type() { return 'renderer'; },
		get execPath() { return process.execPath; },
		get sandboxed() { return process.sandboxed; },

		/**
		 * @returns {string}
		 */
		cwd() {
			return process.env['VSCODE_CWD'] || process.execPath.substr(0, process.execPath.lastIndexOf(process.platform === 'win32' ? '\\' : '/'));
		},

		/**
		 * @returns {Promise<typeof process.env>}
		 */
		shellEnv() {
			return resolveShellEnv;
		},

		/**
		 * @returns {Promise<import('electron').ProcessMemoryInfo>}
		 */
		getProcessMemoryInfo() {
			return process.getProcessMemoryInfo();
		},

		/**
		 * @param {string} type
		 * @param {Function} callback
		 * @returns {void}
		 */
		on(type, callback) {
			// @ts-ignore
			process.on(type, callback);
		}
	};

	const globalAPIs = {
		ipcRenderer: myIpcRenderer,
		process: myProcess,
	};

	/**
	 * If `contextIsolation` is true, we expose the global APIs to the renderer
	 * process. Otherwise we simply put them in the `window` variable.
	 */
	if (process.contextIsolated) {
		contextBridge.exposeInMainWorld('nota', globalAPIs);
	} else {
		window.nota = globalAPIs;
	}

})();

