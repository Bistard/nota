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

(async function () {
	'use strict';

	const { contextBridge, ipcRenderer, webFrame } = require('electron');

	/**
	 * @typedef {import('../../window/common/window').IWindowConfiguration} IWindowConfiguration
	 */

	function validate(channel) {
		if (!channel || !channel.startsWith('nota:')) {
			throw new Error(`Unsupported event IPC channel '${channel}'`);
		}
		return true;
	}

	function retrieveFromArgv(key) {
		for (const arg of process.argv) {
			if (arg.indexOf(`--${key}=`) === 0) {
				// found
				return arg.split('=')[1];
			}
		}
		return undefined;
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
			getProcessMemoryInfo() {
				return process.getProcessMemoryInfo();
			},
			on(type, callback) {
				process.on(type, callback);
			}
		};
	})();

	const wrappedWebFrame = (function wrapWebFrame() {
		return {
			setZoomLevel(level) { webFrame.setZoomLevel(level); },
			getZoomLevel() { return webFrame.getZoomLevel(); },
		};
	})();

	/**
	 * Apply zoom level early before even building the window DOM elements to 
	 * avoid UI flicker.
	 */
	const level = retrieveFromArgv('window-zoom-level');
	webFrame.setZoomLevel(parseInt(level) ?? 0);

	/**
	 * Since some window configurations will be modified after the browser 
	 * window is created (windowID etc.). We have to wait for the updated version.
	 */
	const configuration = await (async function retrieveWindowConfiguration() {
		const configurationChannel = retrieveFromArgv('window-configuration');
		if (!configurationChannel) {
			throw new Error('preload: did not find window-configuration argument');
		}

		if (validate(configurationChannel) === false) {
			throw new Error(`preload: invalid window-configuration channel ${configurationChannel}`);
		}

		const configuration = await ipcRenderer.invoke(configurationChannel);
		return configuration;
	})();

	/**
	 * If `contextIsolation` is true, we expose the global APIs to the renderer
	 * process. Otherwise we simply put them in the `window` variable since
	 * `window` is not isolated from the renderer process.
	 */
	
	const exposedAPIs = {
		ipcRenderer: wrappedIpcRenderer,
		process: wrappedProcess,
		webFrame: wrappedWebFrame,
		WIN_CONFIGURATION: configuration,
	};

	if (process.contextIsolated === true) {
		contextBridge.exposeInMainWorld('nota', exposedAPIs);
	} else {
		window.nota = exposedAPIs;
	}
})();

