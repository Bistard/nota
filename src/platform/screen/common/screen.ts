import { IDimension } from "src/base/common/utilities/size";

export interface IMonitorInfo {
    
    /**
     * The ID of the monitor. This identifier is unique per display and can be 
     * used to distinguish between multiple monitors.
     * @example 2528732444
     */
    readonly id: number;

    /**
     * User-friendly label for the monitor, determined by the platform.
     * @example 'BenQ PD2700U'
     */
    readonly label: string;

    /**
     * The refresh frequency of the monitor, measured in hertz (Hz).

     */
    readonly fps: number;

    /**
     * Can be 0, 90, 180, 270, represents screen rotation in clock-wise degrees.
     */
    readonly rotation: 0 | 90 | 180 | 270;

    /**
     * If the monitor support 'touch' input.
     * If touch support is unknown, this property is set to `undefined`.
     */
    readonly touchSupport?: boolean;

    /**
     * The scale factor (x * 100%) of the display, which indicates how much the 
     * content should be scaled up or down. 
     * 
     * When a display uses scaling up, the operating system reports a scaled-down 
     * resolution to applications unless the app specifically asks for the 
     * unscaled resolution. 
     * 
     * For instance, if your display is set at a scaling factor of 200% (which 
     * is common for high-resolution displays to make text and elements more 
     * readable), and the actual resolution is 3000x2000 pixels, the operating 
     * system might report the resolution as 1500x1000 pixels to applications.
     */
    readonly scaleFactor: number;
    
    /**
     * Provides the scaled and unscaled resolutions of the entire monitor. This 
     * resolution TAKES into account space used by system taskbars and others.
     * 
     * For instance, the monitor resolution is 1920x1080 pixels.
     */
    readonly monitorResolution: IScaledResolution;

    /**
     * Provides the scaled and unscaled resolutions of the monitor's work area.
     * This resolution DOES NOT take into account space used by system taskbars 
     * and others.
     * 
     * For instance, the monitor resolution is 1920x1080 pixels. The work area
     * resolution is 1920x1040 pixels (40 pixels is removed by the taskbars).
     */
    readonly workAreaResolution: IScaledResolution;
}

export interface IScaledResolution {
    
    /**
     * The resolution before any scaling. This is the resolution originally 
     * reported by the operating system. Not the real resolution displayed on 
     * the physical monitor.
     * 
     * For instance, if the scale factor is 200% (2), the unscaled resolution is
     * 1500x1000 pixels.
     */
    readonly unscaledResolution: IDimension;

    /**
     * The resolution after any scaling. This is the actual resolution displayed
     * on the physical monitor.
     * 
     * For instance, if the scale factor is 200% (2), the scaled resolution is
     * 3000x2000 pixels.
     */
    readonly scaledResolution: IDimension;
}