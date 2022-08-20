import { BrowserWindow } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { UUID } from "src/base/node/uuid";
import { ICLIArguments } from "src/code/platform/environment/common/argument";
import { IEnvironmentOpts } from "src/code/platform/environment/common/environment";

export const enum ArgumentKey {
    configuration = 'window-configuration'
}

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
}

export function defaultDisplayState(mode: WindowDisplayMode = WindowDisplayMode.Normal): IWindowDisplayOpts {
    return {
        width: 1024,
		height: 768,
		mode: mode
    };
}

/**
 * Indicates different type of openning option.
 */
export const enum ToOpenType {
    /** @internal */
    Unknown = 0,
    /** Openning a workspace to the window. */
    Workspace,
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
    readonly workspace?: URI;
    readonly directory?: URI;
    readonly filesToOpen?: IFileToOpen[];
}

/**
 * Extending {@link IWindowConfiguration} so that caller can have a chance to
 * override the default settings which are defined by the current environment.
 */
export interface IWindowCreationOptions extends Partial<IWindowConfiguration> {
    
    readonly loadFile: string;
    readonly CLIArgv?: ICLIArguments;
    readonly displayOptions?: IWindowDisplayOpts;

    /**
     * URIs to be opened in the window, might be either workspace, directory or 
     * file.
     */
    readonly uriToOpen?: URI[];
}

/**
 * An interface only for {@link WindowInstance}.
 */
export interface IWindowInstance extends Disposable {
    
    readonly id: number;

    readonly window: BrowserWindow;

    readonly onDidLoad: Register<void>;
    
    readonly onDidClose: Register<void>;

    load(): Promise<void>;

    close(): void;
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