import "src/styles/index.scss";
import "src/workbench/parts/workspace/editor/editor"; // TODO
import { Workbench } from "src/workbench/workbench";
import { IInstantiationService, IServiceProvider, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, registerService, ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ComponentService, IComponentService } from "src/workbench/services/component/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { initExposedElectronAPIs, WIN_CONFIGURATION } from "src/platform/electron/browser/global";
import { IIpcService, IpcService } from "src/platform/ipc/browser/ipcService";
import { BrowserLoggerChannel } from "src/platform/logger/common/loggerChannel";
import { BufferLogger, ILogService, LogLevel, PipelineLogger } from "src/base/common/logger";
import { ILoggerService } from "src/platform/logger/common/abstractLoggerService";
import { IFileService } from "src/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { BrowserFileChannel } from "src/platform/files/browser/fileChannel";
import { ErrorHandler, tryOrDefault } from "src/base/common/error";
import { ApplicationMode, IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { ConsoleLogger } from "src/platform/logger/common/consoleLoggerService";
import { getFormatCurrTimeStamp } from "src/base/common/date";
import { ProxyChannel } from "src/platform/ipc/common/proxy";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { IHostService } from "src/platform/host/common/hostService";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { BrowserLifecycleService, ILifecycleService } from "src/platform/lifecycle/browser/browserLifecycleService";
import { i18n, II18nOpts, II18nService, LanguageType } from "src/platform/i18n/common/i18n";
import { BrowserInstance } from "src/code/browser/browser";
import { APP_CONFIG_NAME, IConfigurationService } from "src/platform/configuration/common/configuration";
import { WorkbenchConfiguration, rendererSideViewConfigurationRegister, rendererWorkbenchConfigurationRegister } from "src/workbench/services/workbench/configuration.register";
import { IProductService, ProductService } from "src/platform/product/common/productService";
import { BrowserConfigurationService } from "src/platform/configuration/browser/browserConfigurationService";
import { URI } from "src/base/common/files/uri";
import { IRegistrantService, RegistrantService } from "src/platform/registrant/common/registrantService";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { ShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import { ReviverRegistrant } from "src/platform/ipc/common/revive";
import { ICommandService, CommandService } from "src/platform/command/common/commandService";
import { IContextService, ContextService } from "src/platform/context/common/contextService";
import { IDialogService, BrowserDialogService } from "src/platform/dialog/browser/browserDialogService";
import { ISideBarService, SideBar } from "src/workbench/parts/sideBar/sideBar";
import { ISideViewService, SideViewService } from "src/workbench/parts/sideView/sideView";
import { Editor } from "src/workbench/parts/workspace/editor/editor";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IWorkspaceService, WorkspaceComponent } from "src/workbench/parts/workspace/workspace";
import { IContextMenuService, ContextMenuService } from "src/workbench/services/contextMenu/contextMenuService";
import { IKeyboardScreenCastService, KeyboardScreenCastService } from "src/workbench/services/keyboard/keyboardScreenCastService";
import { IKeyboardService, KeyboardService } from "src/workbench/services/keyboard/keyboardService";
import { ILayoutService, LayoutService } from "src/workbench/services/layout/layoutService";
import { INotificationService, NotificationService } from "src/workbench/services/notification/notificationService";
import { IShortcutService, ShortcutService } from "src/workbench/services/shortcut/shortcutService";
import { IThemeService, ThemeService } from "src/workbench/services/theme/themeService";
import { rendererWorkbenchCommandRegister } from "src/workbench/services/workbench/command.register";
import { FileTreeService } from "src/workbench/services/fileTree/fileTreeService";
import { IFileTreeMetadataService, IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { IClipboardService } from "src/platform/clipboard/common/clipboard";
import { BrowserClipboardService } from "src/platform/clipboard/browser/clipboardService";
import { ColorRegistrant } from "src/workbench/services/theme/colorRegistrant";

/**
 * @class This is the main entry of the renderer process.
 */
const renderer = new class extends class RendererInstance extends Disposable {

    // [fields]

    private readonly logService!: ILogService;

    // [constructor]

    constructor() {
        super();
    }

    // [public method]

    public async run(): Promise<void> {
        let instantiationService: IInstantiationService | undefined;

        try {
            // retrieve the exposed APIs from preload.js
            initExposedElectronAPIs();

            // ensure we handle almost every errors properly
            this.initErrorHandler();

            // register microservices
            this.rendererServiceRegistrations();

            // core service construction
            instantiationService = this.createCoreServices();

            // service initialization
            await Promise.all([
                this.initServices(instantiationService),
                waitDomToBeLoad().then(() => this.logService.info('renderer', 'Web environment (DOM content) has been loaded.')),
            ]);

            // create workbench UI
            const workbench = instantiationService.createInstance(Workbench);
            workbench.init();

            // browser monitor
            const browser = instantiationService.createInstance(BrowserInstance);
            browser.init();
        }
        catch (error: any) {
            ErrorHandler.onUnexpectedError(error);
        }
    }

    // [private methods]

    // [error handling]

    private initErrorHandler(): void {

        // only enable infinity stack trace when needed for performance issue.
        if (WIN_CONFIGURATION.log === 'trace' || WIN_CONFIGURATION.log === 'debug') {
            Error.stackTraceLimit = Infinity;
        }
        
        // universal on unexpected error handling callback
        const onUnexpectedError = (error: any, additionalMessage?: any) => {
            if (this.logService) {
                const safeAdditional = tryOrDefault('', () => JSON.stringify(additionalMessage));
                this.logService.error('Renderer', `On unexpected error!!! ${safeAdditional}`, error);
            } else {
                console.error(error);
            }
        };

        // case1
        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => onUnexpectedError(error));

        // case2
        window.onerror = (message, source, lineno, colno, error) => {
            onUnexpectedError(error, { message, source, lineNumber: lineno, columnNumber: colno });
            return true; // prevent default handling (log to console)
        };

        // case3
        window.onunhandledrejection = (event: PromiseRejectionEvent) => {
            onUnexpectedError(event.reason, 'unexpected rejection');
            event.preventDefault(); // prevent default handling (log to console)
        };
    }

    // [end]

    // [services initialization]

    private createCoreServices(): IInstantiationService {

        // instantiation-service (Dependency Injection)
        const instantiationService = new InstantiationService(new ServiceCollection());
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);
        (<any>this.logService) = logService;

        // registrant-service
        const registrantService = instantiationService.createInstance(RegistrantService);
        instantiationService.register(IRegistrantService, registrantService);
        this.initRegistrant(instantiationService, registrantService);

        // environment-service
        const environmentService = new BrowserEnvironmentService(logService);
        instantiationService.register(IBrowserEnvironmentService, environmentService);

        // ipc-service
        const ipcService = new IpcService(environmentService.windowID, logService);
        instantiationService.register(IIpcService, ipcService);

        // host-service
        const hostService = ProxyChannel.unwrapChannel<IBrowserHostService>(ipcService.getChannel(IpcChannel.Host), { context: environmentService.windowID });
        instantiationService.register(IHostService, hostService);

        // lifecycle-service
        const lifecycleService = new BrowserLifecycleService(logService, hostService);
        instantiationService.register(ILifecycleService, lifecycleService);

        // file-logger-service
        const loggerService = new BrowserLoggerChannel(ipcService.getChannel(IpcChannel.Logger), environmentService.logLevel);
        instantiationService.register(ILoggerService, loggerService);

        // logger
        const logger = new PipelineLogger([
            // console-logger
            new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN),
            // file-logger
            loggerService.createLogger(environmentService.logPath, {
                name: `window-${environmentService.windowID}-${getFormatCurrTimeStamp()}.txt`,
                description: `renderer`,
            }),
        ]);
        logService.setLogger(logger);

        // file-service
        const fileService = instantiationService.createInstance(BrowserFileChannel);
        instantiationService.register(IFileService, fileService);

        // product-service
        const productService = new ProductService(fileService, logService);
        instantiationService.register(IProductService, productService);

        // configuration-service
        const configurationService = instantiationService.createInstance(
            BrowserConfigurationService,
            { 
                appConfiguration: { 
                    path: URI.join(environmentService.appConfigurationPath, APP_CONFIG_NAME), 
                } 
            },
        );
        instantiationService.register(IConfigurationService, configurationService);

        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService, []));

        // i18n-service
        // REVIEW: try late initialization
        const i18nService = new i18n(
            <II18nOpts>{
                language: configurationService.get<LanguageType>(WorkbenchConfiguration.DisplayLanguage), // FIX: get before init
                localeOpts: {},
            },
            fileService,
            logService,
            environmentService,
        );
        instantiationService.register(II18nService, i18nService);

        // singleton initializations
        for (const [serviceIdentifier, serviceDescriptor] of getSingletonServiceDescriptors()) {
            logService.trace('renderer', `Registering singleton service descriptor: '${serviceIdentifier.toString()}'.`);
            instantiationService.register(serviceIdentifier, serviceDescriptor);
        }

        logService.trace('renderer', 'All core renderer services are constructed.');
        return instantiationService;
    }

    private async initServices(instantiationService: IInstantiationService): Promise<any> {
        this.logService.trace('renderer', 'Start initializing core renderer services...');

        const configurationService = instantiationService.getService(IConfigurationService);
        const environmentService   = instantiationService.getService(IBrowserEnvironmentService);
        const i18nService          = instantiationService.getService(II18nService);
        const productService       = instantiationService.getService(IProductService);

        await configurationService.init()
        .andThen(() => i18nService.init())
        .andThen(() => productService.init(environmentService.productProfilePath))
        .unwrap();
        
        this.logService.trace('renderer', 'All core renderer services are initialized successfully.');
    }

    private rendererServiceRegistrations(): void {

        // registration
        registerService(IKeyboardService          , new ServiceDescriptor(KeyboardService          , []));
        registerService(IShortcutService          , new ServiceDescriptor(ShortcutService          , []));
        registerService(ICommandService           , new ServiceDescriptor(CommandService           , []));
    
        // User Interface
        registerService(ILayoutService            , new ServiceDescriptor(LayoutService            , []));
        registerService(ISideBarService           , new ServiceDescriptor(SideBar                  , []));
        registerService(IWorkspaceService         , new ServiceDescriptor(WorkspaceComponent       , []));
        registerService(IEditorService            , new ServiceDescriptor(Editor                   , []));
        registerService(ISideViewService          , new ServiceDescriptor(SideViewService          , []));
        registerService(IKeyboardScreenCastService, new ServiceDescriptor(KeyboardScreenCastService, []));
        registerService(IThemeService             , new ServiceDescriptor(ThemeService             , []));
        registerService(IFileTreeService          , new ServiceDescriptor(FileTreeService          , []));
        registerService(IFileTreeMetadataService  , new ServiceDescriptor(FileTreeService          , []));
        registerService(IContextMenuService       , new ServiceDescriptor(ContextMenuService       , []));
    
        // utilities && tools
        registerService(IContextService           , new ServiceDescriptor(ContextService           , []));
        registerService(INotificationService      , new ServiceDescriptor(NotificationService      , []));
        registerService(IDialogService            , new ServiceDescriptor(BrowserDialogService     , []));
        registerService(IClipboardService         , new ServiceDescriptor(BrowserClipboardService  , []));
    }

    // [end]

    // [registrant initialization]

    private initRegistrant(service: IInstantiationService, registrant: IRegistrantService): void {
        
        /**
         * DO NOT change the registration orders, orders does matter here.
         */
        registrant.registerRegistrant(this.initConfigurationRegistrant(service));
        registrant.registerRegistrant(service.createInstance(ShortcutRegistrant));
        registrant.registerRegistrant(this.initCommandRegistrant(service));
        registrant.registerRegistrant(service.createInstance(ReviverRegistrant));
        registrant.registerRegistrant(service.createInstance(ColorRegistrant));

        // initialize all the registrations
        registrant.init(service);
    }

    private initConfigurationRegistrant(service: IInstantiationService): ConfigurationRegistrant {
        class BrowserConfigurationRegistrant extends ConfigurationRegistrant {
            public override initRegistrations(provider: IServiceProvider): void {
                super.initRegistrations(provider);
                [
                    rendererWorkbenchConfigurationRegister,
                    rendererSideViewConfigurationRegister,
                ]
                .forEach(register => register(provider));
            }
        }

        return service.createInstance(BrowserConfigurationRegistrant);
    }
    
    private initCommandRegistrant(service: IInstantiationService): CommandRegistrant {
        class BrowserCommandRegistrant extends CommandRegistrant {
            public override initRegistrations(provider: IServiceProvider): void {
                super.initRegistrations(provider);
                [
                    rendererWorkbenchCommandRegister,
                ]
                .forEach(register => register(provider));
            }
        }
        
        return service.createInstance(BrowserCommandRegistrant);
    }

    // [end]
}
{ };

renderer.run();