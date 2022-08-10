/*******************************************************************************
 * Electron's main process is a Node.js environment that has full operating 
 * system access. On top of Electron modules, you can also access Node.js 
 * built-ins, as well as any packages installed via npm. 
 * 
 * On the other hand, renderer processes run web pages and do not run Node.js by 
 * default for security reasons. To bridge Electron's different process types 
 * together, we will need to use a special script called a preload.
 * 
 *******************************************************************************
 * 
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

	// REVIEW
	function retrieveFromAdditionalArgv(key) {
		for (const arg of process.argv) {
			if (arg.indexOf(`--${key}=`) === 0) {
				// found
				return arg.split('=')[1];
			}
		}
		return undefined;
	}

	function validate(channel) {
		if (!channel || !channel.startsWith('nota:')) {
			throw new Error(`Unsupported event IPC channel '${channel}'`);
		}
		return true;
	}

	/**
	 * You never want to directly expose the entire ipcRenderer or other similar
	 * modules via `preload.js`. This would give your renderer the ability to 
	 * send arbitrary IPC messages to the main process, which becomes a powerful 
	 * attack vector for malicious code.
	 */

	const wrappedIpcRenderer = (function wrapIpcRendererAPI() {
		return {
			 send(channel, ...args) {
				if (validate(channel)) {
					ipcRenderer.send(channel, ...args);
				}
			},
			invoke(channel, ...args) {
				if (validate(channel)) {
					return ipcRenderer.invoke(channel, ...args);
				}
			},
			on(channel, listener) {
				if (validate(channel)) {
					ipcRenderer.on(channel, listener);

					return this;
				}
			},
			once(channel, listener) {
				if (validate(channel)) {
					ipcRenderer.once(channel, listener);

					return this;
				}
			},
			removeListener(channel, listener) {
				if (validate(channel)) {
					ipcRenderer.removeListener(channel, listener);

					return this;
				}
			}
		};
	})();

	const wrappedProcess = (function wrapProcessAPI() {
		return {
			get platform() { return process.platform; },
			get arch() { return process.arch; },
			get env() { return { ...process.env }; },
			get pid() { return process.pid; },
			get versions() { return process.versions; },
			get type() { return 'renderer'; },
			get execPath() { return process.execPath; },
			get sandboxed() { return process.sandboxed; },
			cwd() {
				return process.env['NOTA_CWD'] || process.execPath.substr(0, process.execPath.lastIndexOf(process.platform === 'win32' ? '\\' : '/'));
			},
	
			shellEnv() {
				return resolveShellEnv;
			},
	
			getProcessMemoryInfo() {
				return process.getProcessMemoryInfo();
			},
	
			on(type, callback) {
				process.on(type, callback);
			}
		};
	})();

	
	/**
	 * If `contextIsolation` is true, we expose the global APIs to the renderer
	 * process. Otherwise we simply put them in the `window` variable since
	 * `window` is not isolated from the renderer process.
	 */
	
	const exposedAPIs = {
		ipcRenderer: wrappedIpcRenderer,
		process: wrappedProcess,
	};

	if (process.contextIsolated) {
		contextBridge.exposeInMainWorld('nota', exposedAPIs);
	} else {
		window.nota = exposedAPIs;
	}

})();

