import { URI } from "src/base/common/files/uri";
import { UUID } from "src/base/common/utilities/string";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { IEnvironmentOpts } from "src/platform/environment/common/environment";
import { IMonitorInfo } from "src/platform/screen/common/screen";

export const enum ArgumentKey {
    configuration = 'window-configuration'
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
}

/**
 * @description Given a {@link IMonitorInfo}, returns a dynamic adjusted window
 * resolution.
 */
export function defaultDisplayState(info: IMonitorInfo, mode: WindowDisplayMode = WindowDisplayMode.Normal): IWindowDisplayOpts {
    const width = info.monitorResolution.unscaledResolution.width * 0.55;
    const height = info.monitorResolution.unscaledResolution.height * 0.66;

    return {
        width: Math.floor(width),
        height: Math.floor(height),
        mode: mode,
        resizable: true,
        frameless: false,
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

export interface IFileToOpen {
    readonly uri: URI;
    readonly gotoLine?: number;
}

/**
 * Determines what type of URIs are about to be opened in the window.
 */
export interface IUriToOpenConfiguration {
    readonly directory?: URI;
    readonly filesToOpen?: IFileToOpen[];
}

/**
 * A configuration interface for a renderer process window. Once the renderer 
 * process is constructed. You may access to the window configuration through 
 * the global constant `WIN_CONFIGURATION`.
 */
export interface IWindowConfiguration extends ICLIArguments, IEnvironmentOpts {

    readonly machineID: UUID;
    readonly windowID: number;

    readonly uriOpenConfiguration: IUriToOpenConfiguration;
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
     * URIs to be opened in the window, might be either workspace, directory or 
     * file.
     */
    readonly uriToOpen: URI[];
    readonly forceNewWindow: boolean;          // TODO: unused
    
    /** 
     * If under any existed windows operation. 
     */
    readonly hostWindowID: number | undefined; // TODO: unused
}