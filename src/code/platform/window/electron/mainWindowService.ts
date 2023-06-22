import { Disposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { isNumber, Mutable } from "src/base/common/util/type";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifecycleService } from "src/code/platform/lifecycle/electron/mainLifecycleService";
import { ToOpenType, IUriToOpenConfiguration, IWindowConfiguration, IWindowCreationOptions } from "src/code/platform/window/common/window";
import { IWindowInstance, WindowInstance } from "src/code/platform/window/electron/windowInstance";
import { URI } from "src/base/common/file/uri";
import { UUID } from "src/base/common/util/string";

export const IMainWindowService = createService<IMainWindowService>('main-window-service');

/**
 * An interface only for {@link MainWindowService}.
 */
export interface IMainWindowService extends Disposable, IMicroService {
    
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
     * @description Returns the number of running window.
     */
    windowCount(): number;

    open(options: IWindowCreationOptions): IWindowInstance;
}

/**
 * @class Window service has ability to create windows based on different 
 * configurations. It also tracks all the life cycles of every 
 * {@link IWindowInstance}.
 */
export class MainWindowService extends Disposable implements IMainWindowService {

    _microserviceIdentifier: undefined;

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
    ) {
        super();
        this.registerListeners();
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

    public open(options: IWindowCreationOptions): IWindowInstance {
        this.logService.trace('[MainWindowService] trying to open a window...');

        const newWindow = this.doOpen(options);
        
        this.logService.trace('[MainWindowService] window opened');
        return newWindow;
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace(`[MainWindowService] registerListeners()`);
        // noop
    }

    private doOpen(opts: IWindowCreationOptions): IWindowInstance {
        
        let window: IWindowInstance;

        // get openning URIs configuration
        let uriToOpenConfiguration: IUriToOpenConfiguration = Object.create(null);
        if (opts.uriToOpen && opts.uriToOpen.length > 0) {
            const resolveResult = UriToOpenResolver.resolve(opts.uriToOpen);
            uriToOpenConfiguration = resolveResult[0];
            
            // logging any errored openning URIs
            const errorURIs = resolveResult[1];
            if (errorURIs.length) {
                let message = 'Invalid URI when openning in windows. Format should be `path|directory/workspace/file(|<gotoLine>)`. The erroring URIs are: ';
                for (const uri of errorURIs) {
                    message += '\n\t' + URI.toString(uri);
                }
                this.logService.error(message);
            }
        }
        
        /**
         * Important window configuration that relies on previous state of the 
         * application (provided opts, app config, environment and so on). This
         * configuration will be passed as an additional argument when creating
         * a `BrowserWindow`.
         */
        const configuration: IWindowConfiguration = {
            /** {@link ICLIArguments} */
            _:               opts._                ?? this.mainEnvironmentService.CLIArguments._,
            log:             opts.log              ?? this.mainEnvironmentService.CLIArguments.log,
            'open-devtools': opts['open-devtools'] ?? this.mainEnvironmentService.CLIArguments['open-devtools'],
            
            /** {@link IEnvironmentOpts} */
            isPackaged:   opts.isPackaged   ?? this.mainEnvironmentService.isPackaged,
            appRootPath:  opts.appRootPath  ?? this.mainEnvironmentService.appRootPath,
            tmpDirPath:   opts.tmpDirPath   ?? this.mainEnvironmentService.tmpDirPath,
            userDataPath: opts.userDataPath ?? this.mainEnvironmentService.userDataPath,
            userHomePath: opts.userHomePath ?? this.mainEnvironmentService.userHomePath,

            // window configuration
            machineID: this.machineID,
            windowID: -1, // will be update once window is loaded
            uriOpenConfiguration: uriToOpenConfiguration,
        };
        
        // open a new window instance
        window = this.__openInNewWindow(opts, configuration);
        (<Mutable<typeof configuration>>configuration).windowID = window.id;

        // load window
        window.load(configuration);
        
        return window;
    }

    // [private helper methods]

    private __openInNewWindow(options: IWindowCreationOptions, configuration: IWindowConfiguration): IWindowInstance {
        this.logService.trace('[MainWindowService] openInNewWindow');
        
        const newWindow = this.instantiationService.createInstance(
            WindowInstance,
            configuration,
            options,
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
    export function resolve(uris: URI[]): [IUriToOpenConfiguration, URI[]] {
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

    function __parseURI(uri: URI): { resource: string, type: ToOpenType, gotoLine?: number, fail?: boolean } {
        const sections = URI.toFsPath(uri).split('|');
        
        const resource = sections[0];
        const type = sections[1];
        const gotoLine = isNumber(sections[2]) ? Number(sections[2]) : undefined;
        let fail: boolean | undefined;

        if (!resource || !type) {
            fail = true;
        }

        const isDir = type === 'directory' ? ToOpenType.Directory : ToOpenType.Unknown;
        const isFile = type === 'file' ? ToOpenType.File : ToOpenType.Unknown;

        if (isDir === ToOpenType.Unknown && isFile === ToOpenType.Unknown) {
            fail = true;
        }

        return {
            resource: resource!,
            type: isDir | isFile,
            gotoLine: gotoLine,
            fail: fail,
        }
    }

}