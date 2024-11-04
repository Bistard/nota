import { IHostService } from "src/platform/host/common/hostService";

export interface IBrowserHostService extends IHostService {
    focusWindow(): Promise<void>;
    maximizeWindow(): Promise<void>;
    minimizeWindow(): Promise<void>;
    unMaximizeWindow(): Promise<void>;
    toggleMaximizeWindow(): Promise<void>;
    toggleFullScreenWindow(): Promise<void>;
    closeWindow(): Promise<void>;
}