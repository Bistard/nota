import type { INodeProcess } from "src/base/common/process";
import { isDefined, isObject } from "src/base/common/utilities/type";

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
    = function resolvePlatformStatus() {
        let isWin = false;
        let isMac = false;
        let isLinux = false;
        let nodeProcess: INodeProcess | undefined;

        if ((typeof globalThis !== 'undefined') && isDefined(globalThis.nota) && isDefined(globalThis.nota.process)) {
            // Native environment (sandboxed)
            nodeProcess = globalThis.nota.process;
        } else if (typeof process !== 'undefined') {
            // Native environment (non-sandboxed)
            nodeProcess = process;
        }

        const isElectronProcess = typeof nodeProcess?.versions?.electron === 'string';
        const isElectronRenderer = isElectronProcess && nodeProcess?.type === 'renderer';

        // Web environment
        if (typeof navigator === 'object' && !isElectronRenderer) {
            const userAgent = navigator.userAgent;
            isWin = userAgent.indexOf('Windows') >= 0
                || userAgent.indexOf('win32') >= 0; // for Mocha env check: see issue #170
            isMac = userAgent.indexOf('Macintosh') >= 0
                || userAgent.indexOf('darwin') >= 0;
            isLinux = userAgent.indexOf('Linux') >= 0
                || userAgent.indexOf('linux') >= 0;
        }
        // Native environment
        else if (isObject(nodeProcess)) {
            isWin = (nodeProcess.platform === 'win32');
            isMac = (nodeProcess.platform === 'darwin');
            isLinux = (nodeProcess.platform === 'linux');
        }
        // Unknown environment
        else {
            console.error('Unable to resolve the current platform.');
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

export const OPERATING_SYSTEM = (IS_LINUX) ? Platform.Linux : (IS_MAC ? Platform.Mac : Platform.Windows);

/**
 * Indicates if the current operating system is case sensitive.
 *  e.g Linux is case sensitive. Mac and Windows are not.
 */
export const OS_CASE_SENSITIVE = IS_LINUX;


export function PlatformToString(platform: Platform) {
    switch (platform) {
        case Platform.Web: return 'Web';
        case Platform.Mac: return 'Mac';
        case Platform.Linux: return 'Linux';
        case Platform.Windows: return 'Windows';
        default: return 'Unknown';
    }
}