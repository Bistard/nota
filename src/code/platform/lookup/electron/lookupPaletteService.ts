import { globalShortcut } from "electron";
import { ILogService } from "src/base/common/logger";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";
import { IWindowCreationOptions } from "src/code/platform/window/common/window";
import { IMainWindowService } from "src/code/platform/window/electron/mainWindowService";
import { IWindowInstance } from "src/code/platform/window/electron/windowInstance";

const GLOBAL_LOOKUP_KEY = 'Control+Shift+F';

export const ILookupPaletteService = createService<ILookupPaletteService>('main-lookup-service');

export interface ILookupPaletteService extends IMicroService {
    enable(): void;
    disable(): void;
}

/**
 * @class // TODO
 * 
 * @note Service will be constructed once at least one window is opened.
 */
export class LookupPaletteService implements ILookupPaletteService {

    _microserviceIdentifier: undefined;

    // [field]

    private _window?: IWindowInstance;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
        @IMainWindowService private readonly windowService: IMainWindowService,
    ) {}

    // [public methods]

    public enable(): void {
        if (this._window) {
            return;
        }

        this.logService.trace('Main#LookupPaletteService#init()');
        this.registerListeners();
    }

    public disable(): void {
        if (!this._window) {
            return;
        }

        if (globalShortcut.isRegistered(GLOBAL_LOOKUP_KEY)) {
            globalShortcut.unregister(GLOBAL_LOOKUP_KEY);
        }
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace('Main#LookupPaletteService#registerListeners()');

        if (globalShortcut.isRegistered(GLOBAL_LOOKUP_KEY)) {
            this.logService.warn(`Shortcut for lookup-service is already registered: ${GLOBAL_LOOKUP_KEY}, service is turned-off for now.`);
            return;
        }

        globalShortcut.register(GLOBAL_LOOKUP_KEY, () => this.openGlobalLookupPalette());
    }

    private openGlobalLookupPalette(): void {
        
        if (this._window) {
            this._window.close();
            this._window = undefined;
            return;
        }

        const options: IWindowCreationOptions = {
            loadFile: './src/code/browser/lookup/index.html',
            displayOptions: {
                width: 600,
                height: 200,
                minWidth: 600,
                minHeight: 200,
                resizable: false,
            },
            "open-devtools": true,
        };

        const window = this.windowService.open(options);
        this._window = window;
    }
}