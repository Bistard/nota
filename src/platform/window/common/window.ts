import { URI } from "src/base/common/files/uri";
import { UUID } from "src/base/common/utilities/string";
import { ICLIArguments } from "src/platform/environment/common/argument";
import { IEnvironmentOpts } from "src/platform/environment/common/environment";

export const enum ArgumentKey {
    configuration = 'window-configuration'
}

export const DEFAULT_HTML = './src/index.html';
export const INSPECTOR_HTML = './src/code/browser/inspector/index.html';

export const enum WindowDisplayMode {
    Normal,
    Minimized,
    Maximized,
    Fullscreen
}

export const WindowMinimumState = {
    wdith: 400,
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

export function defaultDisplayState(mode: WindowDisplayMode = WindowDisplayMode.Normal): IWindowDisplayOpts {
    return {
        width: 1440,
        height: 1024,
        mode: mode,

        resizable: true,
        frameless: false,
    };
}

/**
 * Indicates different type of openning option.
 */
export const enum ToOpenType {
    /** @internal */
    Unknown = 0,
    /** Openning a directory to the window. */
    Directory,
    /** Openning a file to the window. */
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
 * An interface for constructing a window (renderer process). On the base of
 * {@link IEnvironmentOpts} and {@link ICLIArguments}.
 */
export interface IWindowConfiguration extends ICLIArguments, IEnvironmentOpts {

    readonly machineID: UUID;
    readonly windowID: number;

    readonly uriOpenConfiguration: IUriToOpenConfiguration;
}

/**
 * Extending {@link IWindowConfiguration} so that caller can have a chance to
 * override the default settings which are defined by the current environment.
 */
export interface IWindowCreationOptions extends IWindowConfiguration {

    /** 
     * Specify the loading html file path. Default to {@link DEFAULT_HTML} 
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