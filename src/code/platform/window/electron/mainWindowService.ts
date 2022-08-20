import { Disposable } from "src/base/common/dispose";
import { Emitter, Event, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { isNumber, Mutable } from "src/base/common/util/type";
import { UUID } from "src/base/node/uuid";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IEnvironmentService, IMainEnvironmentService } from "src/code/platform/environment/common/environment";
import { IMainLifeCycleService } from "src/code/platform/lifeCycle/electron/mainLifeCycleService";
import { ToOpenType, IUriToOpenConfiguration, IWindowConfiguration, IWindowCreationOptions, IWindowInstance } from "src/code/platform/window/common/window";
import { WindowInstance } from "src/code/platform/window/electron/windowInstance";
import { URI } from "src/base/common/file/uri";

export const IMainWindowService = createDecorator<IMainWindowService>('main-window-service');

/**
 * An interface only for {@link MainWindowService}.
 */
export interface IMainWindowService extends Disposable {
    
    readonly onDidOpenWindow: Register<IWindowInstance>;

    readonly onDidCloseWindow: Register<IWindowInstance>;

    /**
     * @description Returns all the running windows.
     */
    windows(): ReadonlyArray<IWindowInstance>;

    /**
     * @description Returns the number of running window.
     */
    windowCount(): number;

    open(options: IWindowCreationOptions): IWindowInstance;
}

/**
 * @class Window-service has ability to create windows based on different 
 * configurations. It also tracks all the life cycles of every 
 * {@link IWindowInstance}.
 */
export class MainWindowService extends Disposable implements IMainWindowService {

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
        @IMainLifeCycleService private readonly lifeCycleService: IMainLifeCycleService,
        @IEnvironmentService private readonly environmentMainService: IMainEnvironmentService,
    ) {
        super();
        this.registerListeners();
    }

    // [getter / setter]

    public windows(): readonly IWindowInstance[] {
        return this._windows;
    }

    // [public methods]

    public windowCount(): number {
        return this._windows.length;
    }

    public open(options: IWindowCreationOptions): IWindowInstance {
        this.logService.trace('Main#mainWindowService#trying to open a window...');

        const newWindow = this.doOpen(options);
        
        // load the window in browser
        newWindow.load();

        this.logService.trace('Main#mainWindowService#window opened');
        return newWindow;
    }

    // [private methods]

    private registerListeners(): void {
        this.logService.trace(`Main#MainWindowService#registerListeners()`);
        // noop
    }

    private doOpen(opts: IWindowCreationOptions): IWindowInstance {

        let window: IWindowInstance;

        // get openning URIs configuration
        let uriToOpenConfiguration: IUriToOpenConfiguration = Object.create(null);
        if (opts.uriToOpen) {
            uriToOpenConfiguration = UriToOpenResolver.resolve(opts.uriToOpen);
        }
        
        /**
         * Important window configuration that relies on previous state of the 
         * application (provided opts, app config, environment and so on). This
         * configuration will be passed as an additional argument when creating
         * a `BrowserWindow`.
         */
        const configuration: IWindowConfiguration = {
            /** {@link ICLIArguments} */
            _:               opts._                ?? this.environmentMainService.CLIArguments._,
            log:             opts.log              ?? this.environmentMainService.CLIArguments.log,
            'open-devtools': opts['open-devtools'] ?? this.environmentMainService.CLIArguments['open-devtools'],
            
            /** {@link IEnvironmentOpts} */
            isPackaged:   opts.isPackaged   ?? this.environmentMainService.isPackaged,
            appRootPath:  opts.appRootPath  ?? this.environmentMainService.appRootPath,
            tmpDirPath:   opts.tmpDirPath   ?? this.environmentMainService.tmpDirPath,
            userDataPath: opts.userDataPath ?? this.environmentMainService.userDataPath,
            userHomePath: opts.userHomePath ?? this.environmentMainService.userHomePath,

            // window configuration
            machineID: this.machineID,
            windowID: -1, // will be update once window is loaded
            uriOpenConfiguration: uriToOpenConfiguration,
        };
        
        // open a new window instance
        window = this.__openInNewWindow(opts, configuration);
        (<Mutable<typeof configuration>>configuration).windowID = window.id;
        
        return window;
    }

    // [private helper methods]

    private __openInNewWindow(options: IWindowCreationOptions, configuration: IWindowConfiguration): IWindowInstance {
        this.logService.trace('Main#MainWindowService#openInNewWindow');
        
        const newWindow = this.instantiationService.createInstance(
            WindowInstance,
            configuration,
            options,
        );
        
        this._windows.push(newWindow);
        this._onDidOpenWindow.fire(newWindow);

        // newly window listeners
        Event.once(newWindow.onDidClose)(() => {this._onDidCloseWindow.fire(newWindow)});

        return newWindow;
    }
}

namespace UriToOpenResolver {
    /**
     * @description Given an array of URIs, resolves the ones that follow the
     * following parsing rule.
     * @throws An exception will be thrown if one of the URI does not follow the
     * following pasring rule.
     * ```txt
     * Parsing rule:
     *      Directory - directory_path|directory
     *      Workspace - workspace_path|workspace
     *      File      - file_path|file(|gotoLine)
     * ```
     */
    export function resolve(uris: URI[]): IUriToOpenConfiguration {
        const config: Mutable<IUriToOpenConfiguration> = {};
        
        for (const uri of uris) {
            const parseResult = __parseURI(uri);
            
            if (parseResult.type === ToOpenType.Workspace) {
                config.workspace = URI.fromFile(parseResult.resource);
            } 
            else if (parseResult.type === ToOpenType.Directory) {
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

        return config;
    }

    // [private helper methods]

    function __parseURI(uri: URI): { resource: string, type: ToOpenType, gotoLine?: number } {
        const sections = URI.toFsPath(uri).split('|');
        
        const resource = sections[0];
        const type = sections[1];
        const gotoLine = isNumber(sections[2]) ? Number(sections[2]) : undefined;

        if (!resource || !type) {
            throw new Error('Invalid URI for openning in windows. Format should be `path|directory/workspace/file(|<gotoLine>)`');
        }

        const isWorkspace = type === 'workspace' ? ToOpenType.Workspace : ToOpenType.Unknown;
        const isDir = type === 'directory' ? ToOpenType.Directory : ToOpenType.Unknown;
        const isFile = type === 'file' ? ToOpenType.File : ToOpenType.Unknown;

        if (isWorkspace === ToOpenType.Unknown 
            && isDir === ToOpenType.Unknown 
            && isFile === ToOpenType.Unknown
        ) {
            throw new Error('Invalid URI for openning in windows. Format should be `path|directory/workspace/file(|<gotoLine>)`');
        }

        return {
            resource: resource,
            type: isWorkspace | isDir | isFile,
            gotoLine: gotoLine,
        }
    }

}