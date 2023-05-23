import { IHostService } from "src/code/platform/host/common/hostService";

export interface IBrowserHostService extends IHostService {
    focusWindow(): Promise<void>;
    maximizeWindow(): Promise<void>;
    minimizeWindow(): Promise<void>;
    unmaximizeWindow(): Promise<void>;
    toggleMaximizeWindow(): Promise<void>;
    toggleFullScreenWindow(): Promise<void>;
    closeWindow(): Promise<void>;
}