import { INodeProcess } from "src/base/common/process";
import { GLOBAL } from "src/code/platform/electron/sandbox/global";

interface INavigator {
	userAgent: string;
	language: string;
	maxTouchPoints?: number;
}

export const enum Platform {
	Web,
	Mac,
	Linux,
	Windows,
}

declare const process: INodeProcess;
declare const navigator: INavigator;

export const [IS_WINDOWS, IS_MAC, IS_LINUX, PLATFORM]
 = function () {
    let isWin = false;
    let isMac = false;
    let isLinux = false;
    let userAgent: string | undefined;
    let nodeProcess: INodeProcess | undefined;

    if (typeof GLOBAL.nota !== 'undefined' && typeof GLOBAL.nota.process !== 'undefined') {
        // Native environment (sandboxed)
        nodeProcess = GLOBAL.nota.process;
    } else if (typeof process !== 'undefined') {
        // Native environment (non-sandboxed)
        nodeProcess = process;
    }

    const isElectronProcess = typeof nodeProcess?.versions?.electron === 'string';
    const isElectronRenderer = isElectronProcess && nodeProcess?.type === 'renderer';

    // Web environment
    if (typeof navigator === 'object' && !isElectronRenderer) {
        userAgent = navigator.userAgent;
        isWin = userAgent.indexOf('Windows') >= 0;
        isMac = userAgent.indexOf('Macintosh') >= 0;
        isLinux = userAgent.indexOf('Linux') >= 0;
    }
    // Native environment
    else if (typeof nodeProcess === 'object') {
        isWin = (nodeProcess.platform === 'win32');
        isMac = (nodeProcess.platform === 'darwin');
        isLinux = (nodeProcess.platform === 'linux');
    }
    // Unknown environment
    else {
        console.error('Unable to resolve platform.');
    }

    let _platform: Platform = Platform.Web;
    if (isMac) {
        _platform = Platform.Mac;
    } else if (isWin) {
        _platform = Platform.Windows;
    } else if (isLinux) {
        _platform = Platform.Linux;
    }

    return [isWin, isMac, isLinux, _platform];
}();

export const OperatingSystem = (IS_LINUX) ? Platform.Linux : (IS_MAC ? Platform.Mac : Platform.Windows);

export function PlatformToString(platform: Platform) {
	switch (platform) {
		case Platform.Web: return 'Web';
		case Platform.Mac: return 'Mac';
		case Platform.Linux: return 'Linux';
		case Platform.Windows: return 'Windows';
	}
}