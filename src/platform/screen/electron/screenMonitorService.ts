import { screen } from "electron";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IMonitorInfo } from "src/platform/screen/common/screen";
import { Dimension } from "src/base/common/utilities/size";
import { narrow } from "src/base/common/utilities/panic";

export const IScreenMonitorService = createService<IScreenMonitorService>('screen-monitor-service');

/**
 * An interface only for {@link ScreenMonitorService}.
 */
export interface IScreenMonitorService extends IService {

    /**
     * Retrieves the information about the primary monitor of the system.
     */
    getPrimaryMonitorInfo(): IMonitorInfo;

    /**
     * Retrieves information about all monitors connected to the system.
     */
    getAllMonitorsInfo(): IMonitorInfo[];
}

/**
 * @class Enabling access to detailed information about all connected display 
 * monitors. This service allows to retrieve information about the primary 
 * monitor as well as all other monitors. 
 * 
 * Information provided includes monitor IDs, refresh rates, rotation angles, 
 * scale factors, touch support status, and detailed resolution metrics.
 * 
 * @note The service leverages Electron's `screen` API to fetch raw display data 
 *       and then processes this data to conform to the {@link IMonitorInfo}. 
 */
export class ScreenMonitorService implements IScreenMonitorService {

    declare _serviceMarker: undefined;

    // [public methods]

    public getPrimaryMonitorInfo(): IMonitorInfo {
        const raw = screen.getPrimaryDisplay();
        return this.__constructScreenInfoByRaw(raw);
    }

    public getAllMonitorsInfo(): IMonitorInfo[] {
        return screen.getAllDisplays()
            .map(raw => this.__constructScreenInfoByRaw(raw));
    }

    // [private helper methods]

    private __constructScreenInfoByRaw(raw: Electron.Display): IMonitorInfo {
        return {
            id:           raw.id,
            label:        raw.label,
            fps:          raw.displayFrequency,
            rotation:     narrow(raw.rotation, <const>[0, 90, 180, 270]),
            scaleFactor:  raw.scaleFactor,
            touchSupport: raw.touchSupport === 'available' ? true : (raw.touchSupport === 'unavailable' ? false : undefined),
            
            monitorResolution: {
                unscaledResolution: new Dimension(raw.size.width, raw.size.height),
                scaledResolution:   new Dimension(raw.size.width, raw.size.height).scale(raw.scaleFactor),
            },

            workAreaResolution: {
                unscaledResolution: new Dimension(raw.workAreaSize.width, raw.workAreaSize.height),
                scaledResolution:   new Dimension(raw.workAreaSize.width, raw.workAreaSize.height).scale(raw.scaleFactor),
            }
        };
    }
}