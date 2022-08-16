import { globalShortcut } from "electron";
import { ILogService } from "src/base/common/logger";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

const GLOBAL_LOOKUP_KEY = 'Control+Tab';

export const IMainLookupService = createDecorator<IMainLookupService>('main-lookup-service');

export interface IMainLookupService {
    // empty
}

/**
 * @class // TODO
 */
export class MainLookupService implements IMainLookupService {

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

        globalShortcut.register('Control+Shift+F', () => this.openGlobalLookupBar());
    }

    private openGlobalLookupBar(): void {
        // TODO
    }
}