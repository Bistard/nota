import { Disposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { isNumber, Mutable } from "src/base/common/utilities/type";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/platform/environment/common/environment";
import { IMainLifecycleService } from "src/platform/lifecycle/electron/mainLifecycleService";
import { ToOpenType, IUriToOpenConfiguration, IWindowCreationOptions, DEFAULT_HTML, defaultDisplayState } from "src/platform/window/common/window";
import { IWindowInstance, WindowInstance } from "src/platform/window/electron/windowInstance";
import { URI } from "src/base/common/files/uri";
import { UUID } from "src/base/common/utilities/string";
import { mixin } from "src/base/common/utilities/object";
import { IScreenMonitorService } from "src/platform/screen/electron/screenMonitorService";

export const IMainWindowService = createService<IMainWindowService>('main-window-service');

/**
 * An interface only for {@link MainWindowService}.
 */
export interface IMainWindowService extends Disposable, IService {

    readonly onDidOpenWindow: Register<IWindowInstance>;

    readonly onDidCloseWindow: Register<IWindowInstance>;

    /**
     * @description Returns all the running windows.
     */
    windows(): ReadonlyArray<IWindowInstance>;

    /**
     * @description Returns the opened window by the given id.
     */
    getWindowByID(id: number): IWindowInstance | undefined;

    /**
     * @description Closes the window with corresponding ID.
     */
    closeWindowByID(id: number): void;

    /**
     * @description Returns the number of running window.
     */
    windowCount(): number;

    /**
     * @description Open a window by the given options.
     */
    open(optionalConfiguration: Partial<IWindowCreationOptions>): IWindowInstance;
}

/**
 * @class Window service has ability to create windows based on different 
 * configurations. It also tracks all the life cycles of every 
 * {@link IWindowInstance}.
 */
export class MainWindowService extends Disposable implements IMainWindowService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _windows: IWindowInstance[] = [];

    // [event]

    private readonly _onDidOpenWindow = this.__register(new Emitter<IWindowInstance>());
    public readonly onDidOpenWindow = this._onDidOpenWindow.registerListener;

    private readonly _onDidCloseWindow = this.__register(new Emitter<IWindowInstance>());
    public readonly onDidCloseWindow = this._onDidCloseWindow.registerListener;

    // [constructor]

    constructor(
        private readonly machineID: UUID,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IMainLifecycleService private readonly lifecycleService: IMainLifecycleService,
        @IEnvironmentService private readonly mainEnvironmentService: IMainEnvironmentService,
        @IScreenMonitorService private readonly screenMonitorService: IScreenMonitorService,
    ) {
        super();
        this.registerListeners();
        this.logService.debug('MainWindowService', 'MainWindowService constructed.');
    }

    // [getter / setter]

    public windows(): readonly IWindowInstance[] {
        return this._windows;
    }

    public getWindowByID(id: number): IWindowInstance | undefined {
        for (const window of this._windows) {
            if (window.id === id) {
                return window;
            }
        }
        return undefined;
    }

    // [public methods]

    public windowCount(): number {
        return this._windows.length;
    }

    public open(optionalConfiguration: Partial<IWindowCreationOptions>): IWindowInstance {
        this.logService.debug('MainWindowService', 'trying to open a window...');

        const newWindow = this.doOpen(optionalConfiguration);

        this.logService.debug('MainWindowService', 'window opened.');
        return newWindow;
    }

    public closeWindowByID(id: number): void {
        const window = this.getWindowByID(id);
        if (!window) {
            return;
        }

        window.close();
    }

    // [private methods]

    private registerListeners(): void {
        // noop
    }

    private doOpen(optionalConfiguration: Partial<IWindowCreationOptions>): IWindowInstance {
        let window: IWindowInstance | undefined = undefined;

        // get opening URIs configuration
        let uriToOpenConfiguration: IUriToOpenConfiguration = {};
        if (optionalConfiguration.uriToOpen) {
            uriToOpenConfiguration = UriToOpenResolver.resolve(
                optionalConfiguration.uriToOpen, 
                errorMessage => this.logService.error('MainWindowService', errorMessage),
            );
        }

        const defaultConfiguration: IWindowCreationOptions = {
            /** {@link ICLIArguments} */
            _: this.mainEnvironmentService.CLIArguments._,
            log: this.mainEnvironmentService.CLIArguments.log,
            'open-devtools': this.mainEnvironmentService.CLIArguments['open-devtools'],
            inspector: undefined,

            /** {@link IEnvironmentOpts} */
            isPackaged: this.mainEnvironmentService.isPackaged,
            appRootPath: this.mainEnvironmentService.appRootPath,
            tmpDirPath: this.mainEnvironmentService.tmpDirPath,
            userDataPath: this.mainEnvironmentService.userDataPath,
            userHomePath: this.mainEnvironmentService.userHomePath,

            // window configuration
            machineID: this.machineID,
            windowID: -1, // will be update once window is loaded
            uriOpenConfiguration: uriToOpenConfiguration,

            loadFile: DEFAULT_HTML,
            CLIArgv: this.mainEnvironmentService.CLIArguments,
            displayOptions: defaultDisplayState(),
            
            uriToOpen: [],
            forceNewWindow: false,
            hostWindowID: undefined,
        };

        /**
         * Important window configuration that relies on previous state of the 
         * application (provided opts, app config, environment and so on). This
         * configuration will be passed when creating a `BrowserWindow`.
         */
        const configuration = mixin<Mutable<IWindowCreationOptions>>(defaultConfiguration, optionalConfiguration, true);

        // open a new window instance
        window = this.__openInNewWindow(configuration);
        configuration.windowID = window.id;

        // load window
        this.logService.debug('MainWindowService', 'Loading window...');
        this.logService.debug('MainWindowService', 'Primary monitor information:', { information: this.screenMonitorService.getPrimaryMonitorInfo() });

        window.load(configuration).then(() => this.logService.debug('MainWindowService', 'Window loaded successfully.'));

        return window;
    }

    // [private helper methods]

    private __openInNewWindow(configuration: IWindowCreationOptions): IWindowInstance {
        const newWindow = this.instantiationService.createInstance(
            WindowInstance,
            configuration,
        );

        this._windows.push(newWindow);
        this._onDidOpenWindow.fire(newWindow);

        // newly window listeners
        Event.once(newWindow.onDidClose)(() => this.__onWindowDidClose(newWindow));

        return newWindow;
    }

    private __onWindowDidClose(window: IWindowInstance): void {
        this._windows.splice(this._windows.indexOf(window), 1);
        this._onDidCloseWindow.fire(window);
    }
}

namespace UriToOpenResolver {

    export function resolve(uriToOpen: URI[], onError: (message: string) => void): IUriToOpenConfiguration {
        const resolveResult = __parse(uriToOpen);
        const uriToOpenConfiguration = resolveResult[0];

        // logging any errored opening URIs
        const errorURIs = resolveResult[1];
        if (errorURIs.length) {
            let message = 'Invalid URI when opening in windows. Format should be `path|directory/workspace/file(|<gotoLine>)`. The erroring URIs are: ';
            for (const uri of errorURIs) {
                message += '\n\t' + URI.toString(uri);
            }
            onError(message);
        }

        return uriToOpenConfiguration;
    }

    /**
     * @description Given an array of URIs, resolves the ones that follow the
     * following parsing rule.
     * ```txt
     * Parsing rule:
     *      Directory - directory_path|directory
     *      Workspace - workspace_path|workspace
     *      File      - file_path|file(|gotoLine)
     * ```
     */
    function __parse(uris: URI[]): [IUriToOpenConfiguration, URI[]] {
        const config: Mutable<IUriToOpenConfiguration> = {};
        const errorURIs: URI[] = [];

        for (const uri of uris) {
            const parseResult = __parseURI(uri);

            // the parsing fails, we record this URI and continue.
            if (parseResult.fail) {
                errorURIs.push(uri);
                continue;
            }

            if (parseResult.type === ToOpenType.Directory) {
                config.directory = URI.fromFile(parseResult.resource);
            }
            else if (parseResult.type === ToOpenType.File) {
                if (!config.filesToOpen) {
                    config.filesToOpen = [];
                }
                config.filesToOpen.push({
                    uri: URI.fromFile(parseResult.resource),
                    gotoLine: parseResult.gotoLine
                });
            }
        }

        return [config, errorURIs];
    }

    // [private helper methods]

    function __parseURI(uri: URI): { resource: string, type: ToOpenType, gotoLine?: number, fail?: boolean; } {
        const sections = URI.toFsPath(uri).split('|');

        const resource = sections[0];
        const type = sections[1];
        const gotoLine = isNumber(sections[2]) ? Number(sections[2]) : undefined;
        let fail: boolean | undefined;

        if (!resource || !type) {
            fail = true;
        }

        const isDir =  (type === 'directory') ? ToOpenType.Directory : ToOpenType.Unknown;
        const isFile = (type === 'file')      ? ToOpenType.File      : ToOpenType.Unknown;

        if (isDir === ToOpenType.Unknown && isFile === ToOpenType.Unknown) {
            fail = true;
        }

        return {
            resource: resource!,
            type: isDir | isFile,
            gotoLine: gotoLine,
            fail: fail,
        };
    }
}