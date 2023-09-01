import "src/styles/index.scss";
import "src/workbench/parts/workspace/editor/editor";
import { Workbench } from "src/workbench/workbench";
import { rendererServiceRegistrations } from "src/code/browser/service.register";
import { IInstantiationService, IServiceProvider, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ComponentService, IComponentService } from "src/workbench/services/component/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/platform/instantiation/common/descriptor";
import { initExposedElectronAPIs } from "src/platform/electron/browser/global";
import { IIpcService, IpcService } from "src/platform/ipc/browser/ipcService";
import { BrowserLoggerChannel } from "src/platform/logger/common/loggerChannel";
import { BufferLogger, ILogService, LogLevel, PipelineLogger } from "src/base/common/logger";
import { ILoggerService } from "src/platform/logger/common/abstractLoggerService";
import { IFileService } from "src/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/platform/environment/browser/browserEnvironmentService";
import { BrowserFileChannel } from "src/platform/files/browser/fileChannel";
import { ErrorHandler } from "src/base/common/error";
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
import { WorkbenchConfiguration, rendererWorkbenchConfigurationRegister } from "src/code/browser/configuration.register";
import { IProductService, ProductService } from "src/platform/product/common/productService";
import { BrowserConfigurationService } from "src/platform/configuration/browser/browserConfigurationService";
import { URI } from "src/base/common/file/uri";
import { IRegistrantService, RegistrantService } from "src/platform/registrant/common/registrantService";
import { ConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { rendererSideViewConfigurationRegister } from "src/workbench/parts/sideView/configuration.register";
import { CommandRegistrant } from "src/platform/command/common/commandRegistrant";
import { rendererWorkbenchCommandRegister } from "src/workbench/services/workbench/command.register";
import { ShortcutRegistrant } from "src/workbench/services/shortcut/shortcutRegistrant";
import { rendererWorkbenchShortcutRegister } from "src/workbench/services/workbench/shortcut.register";
import { RegistrantType } from "src/platform/registrant/common/registrant";

/**
 * @class This is the main entry of the renderer process.
 */
const renderer = new class extends class RendererInstance extends Disposable {

    // [constructor]

    constructor() {
        super();
    }

    // [public method]

    public async run(): Promise<void> {
        ErrorHandler.setUnexpectedErrorExternalCallback((error: any) => console.error(error));

        let instantiaionService: IInstantiationService | undefined;
        try {
            // retrieve the exposed APIs from preload.js
            initExposedElectronAPIs();

            // init all kinds of registrations by registrants
            this.initRegistrations();

            // core service construction
            instantiaionService = this.createCoreServices();

            // service initialization
            await Promise.all([
                this.initServices(instantiaionService),
                waitDomToBeLoad(),
            ]);

            // create workbench UI
            const workbench = instantiaionService.createInstance(Workbench);
            workbench.init();

            // browser monitor
            const browser = instantiaionService.createInstance(BrowserInstance);
            browser.init();
        }
        catch (error: any) {
            // try to log out the error message
            if (instantiaionService) {
                try {
                    const logService = instantiaionService.getService(ILogService);
                    logService.error(error);
                } catch { }
            }
            ErrorHandler.onUnexpectedError(error);
        }
    }

    // [private methods]

    private createCoreServices(): IInstantiationService {

        // instantiation-service (Dependency Injection)
        const instantiationService = new InstantiationService(new ServiceCollection());
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);

        // registrant-service
        const registrantService = instantiationService.createInstance(RegistrantService);
        instantiationService.register(IRegistrantService, registrantService);
        this.registrantRegistrations(instantiationService, registrantService);

        // environment-service
        const environmentService = new BrowserEnvironmentService(logService);
        instantiationService.register(IBrowserEnvironmentService, environmentService);

        // ipc-service
        const ipcService = new IpcService(environmentService.windowID);
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
        const fileService = new BrowserFileChannel(ipcService);
        instantiationService.register(IFileService, fileService);

        // product-service
        const productService = new ProductService(fileService);
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
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
            instantiationService.register(serviceIdentifer, serviceDescriptor);
        }

        return instantiationService;
    }

    private async initServices(instantiaionService: IInstantiationService): Promise<any> {
        const configuraionService = instantiaionService.getService(IConfigurationService);
        const environmentService = instantiaionService.getService(IBrowserEnvironmentService);
        const i18nService = instantiaionService.getService(II18nService);
        const productService = instantiaionService.getService(IProductService);

        return Promise.all<any>([
            configuraionService.init(),
            i18nService.init(),
            productService.init(environmentService.productProfilePath),
        ]);
    }

    private registrantRegistrations(provider: IServiceProvider, service: IRegistrantService): void {
        
        // configuration registrations
        service.registerRegistrant(new class extends ConfigurationRegistrant {
            public override initRegistrations(): void {
                super.initRegistrations();
                [
                    rendererWorkbenchConfigurationRegister,
                    rendererSideViewConfigurationRegister,
                ]
                .forEach((register) => register(provider));
            }
        }());

        // command registrations
        service.registerRegistrant(new class extends CommandRegistrant {
            public override initRegistrations(): void {
                super.initRegistrations();
                [
                    rendererWorkbenchCommandRegister,
                ]
                .forEach((register) => register(provider));
            }
        }());

        // shortcut registrations
        service.registerRegistrant(new class extends ShortcutRegistrant {
            public override initRegistrations(): void {
                super.initRegistrations();
                [
                    rendererWorkbenchShortcutRegister,
                ]
                .forEach((register) => register(provider));
            }
        }(service.getRegistrant(RegistrantType.Command)));

        // TODO


        // initialize all the registrations
        service.init();
    }

    /**
     * @deprecated
     * // TODO: remove
     */
    private initRegistrations(): void {
        rendererServiceRegistrations();
    }
}
{ };

renderer.run();