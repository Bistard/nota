import { globalShortcut } from "electron";
import { ILogService } from "src/base/common/logger";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

const GLOBAL_LOOKUP_KEY = 'Control+Tab';

export const ILookupPaletteService = createDecorator<ILookupPaletteService>('main-lookup-service');

export interface ILookupPaletteService {
    // empty
}

/**
 * @class // TODO
 */
export class LookupPaletteService implements ILookupPaletteService {

    constructor(
        @ILogService private readonly logService: ILogService,
    ) {
        this.registerListeners();
    }

    // [private methods]

    private registerListeners(): void {
        
        if (globalShortcut.isRegistered(GLOBAL_LOOKUP_KEY)) {
            this.logService.warn(`Shortcut for lookup-service is already registered: ${GLOBAL_LOOKUP_KEY}, service is turned-off for now.`);
            return;
        }

        globalShortcut.register(GLOBAL_LOOKUP_KEY, () => this.openGlobalLookupBar());
    }

    private openGlobalLookupBar(): void {
        // TODO
    }
}