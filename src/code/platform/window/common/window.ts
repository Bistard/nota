import { BrowserWindow } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { LogLevel } from "src/base/common/logger";
import { UUID } from "src/base/node/uuid";
import { ICLIArguments } from "src/code/platform/environment/common/argument";
import { IEnvironmentOpts } from "src/code/platform/environment/common/environment";

export const enum ProcessKey {
    configuration = 'window-config'
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

export interface IWindowDisplayState {
    width?: number;
	height?: number;
	x?: number;
	y?: number;
	mode?: WindowDisplayMode;
}

export function defaultDisplayState(mode: WindowDisplayMode = WindowDisplayMode.Normal): IWindowDisplayState {
    return {
        width: 1024,
		height: 768,
		mode: mode
    };
}

export interface IOpenWindowOpts {
    
    readonly CLIArgv: ICLIArguments;

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
 * {@link IEnvironmentOpts}.
 */
export interface ICreateWindowConfiguration extends ICLIArguments, IEnvironmentOpts {

    readonly machineID: UUID;
    readonly windowID: number;

    displayState?: IWindowDisplayState;
}