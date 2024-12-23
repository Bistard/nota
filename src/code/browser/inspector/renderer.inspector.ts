import { Button } from "src/base/browser/basic/button/button";
import { addDisposableListener, EventType, Orientation, waitDomToBeLoad } from "src/base/browser/basic/dom";
import { IWidget } from "src/base/browser/basic/widget";
import { WidgetBar } from "src/base/browser/secondary/widgetBar/widgetBar";
import { ErrorHandler } from "src/base/common/error";
import { Event, monitorEventEmitterListenerGC } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { ILogService, BufferLogger, LogLevel } from "src/base/common/logger";
import { errorToMessage } from "src/base/common/utilities/panic";
import { toBoolean } from "src/base/common/utilities/type";
import { initGlobalErrorHandler } from "src/code/browser/common/renderer.common";
import { InspectorTree } from "src/code/browser/inspector/inspectorTree";
import { BrowserConfigurationService } from "src/platform/configuration/browser/browserConfigurationService";
import { APP_CONFIG_NAME, IConfigurationService } from "src/platform/configuration/common/configuration";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { initExposedElectronAPIs, ipcRenderer, safeIpcRendererOn, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { IBrowserEnvironmentService, ApplicationMode } from "src/platform/environment/common/environment";
import { BrowserFileChannel } from "src/platform/files/browser/fileChannel";
import { IFileService } from "src/platform/files/common/fileService";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { InspectorData, InspectorDataType } from "src/platform/inspector/common/inspector";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { IpcService, IIpcService } from "src/platform/ipc/browser/ipcService";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ProxyChannel } from "src/platform/ipc/common/proxy";
import { ReviverRegistrant } from "src/platform/ipc/common/revive";
import { BrowserLifecycleService, IBrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { ConsoleLogger } from "src/platform/logger/common/consoleLoggerService";
import { IRegistrantService, RegistrantService } from "src/platform/registrant/common/registrantService";

/**
 * InspectorRenderer first entry for inspector window.
 */
new class InspectorRenderer {
    
    // [fields]

    private readonly logService!: ILogService;

    // [constructor]

    constructor() {
        this.init();
    }
    
    // [public methods]

    public async init(): Promise<void> {

        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => console.error(error));

        let instantiationService: IInstantiationService | undefined;
        try {
            // retrieve the exposed APIs from preload.js
            initExposedElectronAPIs();
            monitorEventEmitterListenerGC({
                listenerGCedWarning: toBoolean(WIN_CONFIGURATION.listenerGCedWarning),
            });

            // ensure we handle almost every errors properly
            initGlobalErrorHandler(() => this.logService, WIN_CONFIGURATION, error => {
                const hostService = instantiationService!.getOrCreateService(IHostService);
                hostService.showMessageBox({
                    type: 'error',
                    title: 'Unexpected Error',
                    message: errorToMessage(error),
                    detail: '',
                    buttons: ['OK'],
                });
            });

            // core service construction
            instantiationService = this.createCoreServices();

            // service initialization
            await Promise.all([
                this.initServices(instantiationService),
                waitDomToBeLoad().then(() => this.logService?.info('renderer', 'Web environment (DOM content) has been loaded.')),
            ]);

            // view initialization
            const window = instantiationService.createInstance(InspectorWindow, document.body);

            // browser initialization
            const browser = instantiationService.createInstance(InspectorBrowser, window);
        }
        catch (error: any) {
            ErrorHandler.onUnexpectedError(error);
        }
    }

    // [private helper methods]

    private createCoreServices(): IInstantiationService {
        
        // instantiation-service (Dependency Injection)
        const instantiationService = new InstantiationService(new ServiceCollection());
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);
        (<any>this.logService) = logService;

        // environment-service
        const environmentService = new BrowserEnvironmentService(logService);
        instantiationService.register(IBrowserEnvironmentService, environmentService);
        
        // logger
        logService.setLogger(new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN));

        // registrant-service
        const registrantService = new RegistrantService(logService);
        instantiationService.register(IRegistrantService, registrantService);
        registrantService.registerRegistrant(instantiationService.createInstance(ConfigurationRegistrant));
        registrantService.registerRegistrant(instantiationService.createInstance(ReviverRegistrant));
        registrantService.init(instantiationService);

        // ipc-service
        const ipcService = new IpcService(environmentService.windowID, logService);
        instantiationService.register(IIpcService, ipcService);

        // host-service
        const hostService = ProxyChannel.unwrapChannel<IBrowserHostService>(ipcService.getChannel(IpcChannel.Host), { context: environmentService.windowID });
        instantiationService.register(IHostService, hostService);

        // lifecycle-service
        const lifecycleService = new BrowserLifecycleService(logService, hostService);
        instantiationService.register(ILifecycleService, lifecycleService);

        // file-service
        const fileService = instantiationService.createInstance(BrowserFileChannel);
        instantiationService.register(IFileService, fileService);

        // configuration-service
        const configurationService = instantiationService.createInstance(BrowserConfigurationService, { 
            appConfiguration: { path: URI.join(environmentService.appConfigurationPath, APP_CONFIG_NAME) } 
        });
        instantiationService.register(IConfigurationService, configurationService);

        return instantiationService;
    }

    private async initServices(instantiationService: IInstantiationService): Promise<any> {
        const configurationService = instantiationService.getService(IConfigurationService);
        await configurationService.init().unwrap();
    }
};

class InspectorBrowser {
    
    // [field]

    private readonly _view: InspectorWindow;

    // [constructor]

    constructor(
        view: InspectorWindow,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IHostService private readonly hostService: IHostService,
        @IBrowserEnvironmentService private readonly environmentService: IBrowserEnvironmentService,
    ) {
        this._view = view;
        this.registerListeners();
        this.hostService.setWindowAsRendererReady();
    }

    // [public methods]

    private registerListeners(): void {

        // listener: before quit, notify the main process we are actually closing
        this.lifecycleService.onWillQuit(e => {
            ipcRenderer.send(IpcChannel.InspectorClose, WIN_CONFIGURATION.windowID);
        });

        // listener: update view for incoming data
        safeIpcRendererOn(IpcChannel.InspectorDataSync, (e, data: InspectorData[]) => {
            this._view.onData(data);
        });

        // auto re-layout
        {
            addDisposableListener(window, EventType.resize, () => {
                this._view.layout();
            });
            const anyEvents = Event.any([
                this.hostService.onDidEnterFullScreenWindow,
                this.hostService.onDidLeaveFullScreenWindow,
                this.hostService.onDidMaximizeWindow,
                this.hostService.onDidUnMaximizeWindow,
            ]);
            anyEvents(windowID => {
                if (windowID === this.environmentService.windowID) {
                    this._view.layout();
                }
            });
        }
    }
}

class InspectorWindow {
    
    // [field]

    private readonly _parent: HTMLElement;
    private readonly _navBar: WidgetBar<IWidget>;
    private readonly _inspectorViewContainer: HTMLElement;
    private _tree?: InspectorTree;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        this._parent = parent;

        const viewContainer = document.createElement('div');
        viewContainer.className = 'inspector-view-container';

        this._navBar = this.__buildNavigationBar(viewContainer);
        this._inspectorViewContainer = this.__buildInspectorView(viewContainer);

        parent.appendChild(viewContainer);
    }

    // [public methods]

    public onData(data: InspectorData[]): void {
        if (this._tree) {
            this._tree.dispose();
            this._tree = undefined;
        }
        this._tree = new InspectorTree(this._inspectorViewContainer, data, this.configurationService);
    }

    public layout(): void {
        this._tree?.layout();
    }

    // [private methods]

    private __buildNavigationBar(parent: HTMLElement): WidgetBar<IWidget> {
        const navBar = new WidgetBar('inspector-bar', { orientation: Orientation.Horizontal, parentContainer: parent });

        const navigation = [
            { type: InspectorDataType.Configuration },
            { type: InspectorDataType.Status },
            { type: InspectorDataType.ContextKey },
            { type: InspectorDataType.Command },
            { type: InspectorDataType.Shortcut },
            { type: InspectorDataType.Color },
            { type: InspectorDataType.Menu },
        ];

        let currButton: Button | undefined = undefined;
        
        for (const { type } of navigation) {
            const button = new Button({ id: type, label: type });
            navBar.addItem({
                id: type,
                data: button,
                dispose: button.dispose.bind(button),
            });
            button.onDidClick(() => {
                if (currButton) {
                    currButton.element.classList.toggle('focused');
                }
                currButton = button;
                button.element.classList.toggle('focused');
                this.__beginListening(type);
            });
        }
        
        navBar.render();
        return navBar;
    }

    private __beginListening(listenToType: InspectorDataType): void {
        ipcRenderer.send(IpcChannel.InspectorReady, WIN_CONFIGURATION.windowID, listenToType);
    }

    private __buildInspectorView(parent: HTMLElement): HTMLElement {
        const inspectorView = document.createElement('div');
        inspectorView.className = 'inspector-view';
        
        parent.appendChild(inspectorView);
        return inspectorView;
    }
}

