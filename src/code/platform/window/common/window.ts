import { ICLIArguments } from "src/code/platform/environment/common/argument";

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

