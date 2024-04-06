import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IDiagnosticsService = createService<IDiagnosticsService>('diagnostics-service');

/**
 * An interface only for {@link DiagnosticsService}.
 */
export interface IDiagnosticsService extends IService {
    
    /**
     * @description Gathers and returns diagnostic information about the current 
     * system and application as a formatted string. Includes details such as 
     * app version, operating system, kernel version, CPU, memory, and more.
     */
    getDiagnostics(): string;
    getSystemsInfo(): ISystemsInfo;
    getMachineInfo(): IMachineInfo;
}

export interface ISystemsInfo extends IMachineInfo {

    /**
     * The PID of the main process.
     */
    readonly procPID: number;

    /**
     * The process arguments concatenated in a string.
     * @note All arguments after argv[0], the exec path.
     */    
    readonly procArgs: string;

    /**
     * The Graphics Feature Status from `chrome://gpu/`.
     *
     * @note This information is only usable after the `gpu-info-update` event 
     * is emitted.
     */
    readonly gpuStatus: any;
    
    /**
     * Returns 'yes' if Chrome's accessibility support is enabled, `no` otherwise. 
     * 
     * This property will be `true` if the use of assistive technologies, such 
     * as screen readers, has been detected. 
     */
    readonly accessibilitySupport: string;

    /**
     * An array containing the 1, 5, and 15 minute load averages.
     *
     * The load average is a measure of system activity calculated by the 
     * operating system and expressed as a fractional number.
     *
     * The load average is a Unix-specific concept. On Windows, the return value 
     * is always `[0, 0, 0]`.
     * @platform darwin
     */
    readonly loadAverage?: string;
}


export interface IMachineInfo {
	
    /** 
     * Operating system basic info. 
     */
    readonly os: string;

    /** 
     * Kernel version.
     */
    readonly kernel: string;

    /**
     * Returns an array of objects containing information about each logical CPU 
     * core.
     */
	readonly cpus?: string;
	readonly memory: string;
    readonly linuxEnv?: ILinuxEnvInfo;
}

export interface ILinuxEnvInfo {
	readonly desktopSession?: string;
	readonly xdgSessionDesktop?: string;
	readonly xdgCurrentDesktop?: string;
	readonly xdgSessionType?: string;
}
