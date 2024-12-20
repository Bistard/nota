import { URI } from "src/base/common/files/uri";
import { IS_MAC } from "src/base/common/platform";
import { UUID } from "src/base/common/utilities/string";
import { IRecentOpenedTarget } from "src/platform/app/common/recentOpen";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { IEnvironmentOpts } from "src/platform/environment/common/environment";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IMonitorInfo } from "src/platform/screen/common/screen";

/**
 * Indicates the lifecycle of {@link WindowInstance}.
 */
export const enum WindowInstancePhase {
    Initializing,
    RendererReady,
    Closed,
}

/**
 * Argument names of {@link WindowInstance}.
 */
export const enum WindowInstanceArgumentKey {
    configuration = 'window-configuration',
    zoomLevel = 'window-zoom-level',
}

export const DEFAULT_HTML = './src/index.html';
export const INSPECTOR_HTML = './src/code/browser/inspector/index.html';

export const enum WindowDisplayMode {
    Normal = 'Normal',
    Minimized = 'Minimized',
    Maximized = 'Maximized',
    Fullscreen = 'Fullscreen'
}

export const WINDOW_MINIMUM_STATE = {
    width: 400,
    height: 300
};

export interface IWindowDisplayOpts {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    x?: number;
    y?: number;
    readonly resizable?: boolean;
    readonly mode?: WindowDisplayMode;
    readonly frameless?: boolean;
    readonly alwaysOnTop?: boolean;
}

/**
 * @description Given a {@link IMonitorInfo}, returns a dynamic adjusted window
 * resolution.
 */
export function defaultDisplayState(info: IMonitorInfo, mode: WindowDisplayMode = WindowDisplayMode.Normal): IWindowDisplayOpts {
    const { width, height } = info.workAreaResolution.unscaledResolution;
    let scaleFactor = 1;

    // TODO: dynamically adjust scaleFactor levels according to current display size
    if (IS_MAC) {
        scaleFactor = 1.2;
    }

    const adjustedWidth  = Math.round((width * scaleFactor) * 0.55);
    const adjustedHeight = Math.round((height * scaleFactor) * 0.66);

    return {
        width: adjustedWidth,
        height: adjustedHeight,
        mode: mode,
        resizable: true,
        frameless: false,
    };
}

export function shouldUseWindowControlOverlay(): boolean {
    if (IS_MAC) {
        return false;
    }
    return true;
}

export function resolveWindowControlOverlayOptions(options: Electron.TitleBarOverlayOptions): Required<Electron.TitleBarOverlayOptions> {
    return {
        color: options.color ?? '#ffffff',
        symbolColor: options.symbolColor ?? 'black',
        height: options.height ?? 29, // the smallest size of the title bar on windows accounting for the border on windows 11
    };
}

/**
 * Indicates different type of opening option.
 */
export const enum ToOpenType {
    /** @internal */
    Unknown = 0,
    /** Opening a directory to the window. */
    Directory,
    /** Opening a file to the window. */
    File,
}

/**
 * Determines what type of URIs are about to be opened in the window.
 */
export interface IUriToOpenConfiguration {
    readonly directory?: IRecentOpenedTarget;
    readonly files?: IRecentOpenedTarget[]; // TODO: unused
}

/**
 * Determine the language settings and paths to locale resources used by the application.
 */
export interface INlsConfiguration {
    /**
     * Locale as defined in the application's configuration or defaults.
     */
    readonly userLocale: string;

    /**
     * Locale derived from the operating system's preferences.
     */
    readonly osLocale: string;

    /**
     * The resolved UI language based on user and OS settings.
     */
    readonly resolvedLanguage: string;
}

/**
 * A configuration interface for a renderer process window. Once the renderer 
 * process is constructed. You may access to the window configuration through 
 * the global constant `WIN_CONFIGURATION`.
 */
export interface IWindowConfiguration extends ICLIArguments, IEnvironmentOpts {

    /**
     * A title name of the application.
     */
    readonly applicationName: string;
    readonly machineID: UUID;
    readonly windowID: number;

    readonly uriOpenConfiguration: IUriToOpenConfiguration;
    readonly nlsConfiguration: INlsConfiguration;
    /** 
     * If under any existed windows operation. If not, this will sets to -1.
     */
    readonly hostWindow: number;
}

/**
 * An options for constructing a window, often used in the main process. This 
 * extends {@link IWindowConfiguration} so that caller can have a chance to
 * override the default settings which are defined by the current environment.
 */
export interface IWindowCreationOptions extends IWindowConfiguration {

    /** 
     * Specify the loading html file path. Default to {@link DEFAULT_HTML}.
     */
    readonly loadFile: string;
    readonly CLIArgv: ICLIArguments;
    readonly displayOptions: IWindowDisplayOpts;

    /**
     * If window id is provided, this new window's lifecycle will bind with the
     * given window id.
    */
   readonly ownerWindow: number | undefined;
   
   readonly forceNewWindow: boolean; // TODO: unused
}

/**
 * This is mapping type for {@link WindowInstance} IPC channel communication.
 */
export type WindowInstanceIPCMessageMap = {
    [IpcChannel.rendererAlertError]: [error: any];
    [IpcChannel.rendererRunCommand]: [request: IWindowRunRendererCommandRequest];
    [IpcChannel.windowOnBeforeUnload]: [channels: { okChannel: string; vetoChannel: string; }];

    // if not predefined, fallback to general case.
    [key: string]: any[];
};

export interface IWindowRunRendererCommandRequest {
    readonly commandID: string;
    readonly args: any[];
}