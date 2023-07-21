import "src/styles/index.scss";
import "src/code/common/common.register";
import "src/code/browser/workbench/parts/workspace/editor/editor";
import { Workbench } from "src/code/browser/workbench/workbench";
import { rendererServiceRegistrations } from "src/code/browser/service.register";
import { workbenchShortcutRegistrations } from "src/code/browser/service/workbench/shortcut.register";
import { workbenchCommandRegistrations } from "src/code/browser/service/workbench/command.register";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/component/componentService";
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
import { i18n, Ii18nOpts, Ii18nService, LanguageType } from "src/platform/i18n/common/i18n";
import { BrowserInstance } from "src/code/browser/browser";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { WorkbenchConfiguration } from "src/code/browser/configuration.register";
import { IProductService, ProductService } from "src/platform/product/common/productService";
import { BrowserConfigurationService } from "src/platform/configuration/browser/browserConfigurationService";

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
        const serviceCollection = new ServiceCollection();
        const instantiationService = new InstantiationService(serviceCollection);

        // instantiation-service (itself)
        instantiationService.register(IInstantiationService, instantiationService);

        // log-service
        const logService = new BufferLogger();
        instantiationService.register(ILogService, logService);

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
        const configuraionService = new BrowserConfigurationService(environmentService.appConfigurationPath, fileService, logService);
        instantiationService.register(IConfigurationService, configuraionService);

        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // i18n-service
        // REVIEW: try late initialization
        const i18nService = new i18n(
            <Ii18nOpts>{
                language: configuraionService.get<LanguageType>(WorkbenchConfiguration.DisplayLanguage), // FIX: get before init
                localeOpts: {},
            },
            fileService,
            logService,
            environmentService,
        );
        instantiationService.register(Ii18nService, i18nService);

        // singleton initializations
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
            instantiationService.register(serviceIdentifer, serviceDescriptor);
        }

        return instantiationService;
    }

    private async initServices(instantiaionService: IInstantiationService): Promise<any> {
        const configuraionService = instantiaionService.getService(IConfigurationService);
        const environmentService = instantiaionService.getService(IBrowserEnvironmentService);
        const i18nService = instantiaionService.getService(Ii18nService);
        const productService = instantiaionService.getService(IProductService);

        return Promise.all<any>([
            configuraionService.init(),
            i18nService.init(),
            productService.init(environmentService.productProfilePath),
        ]);
    }

    private initRegistrations(): void {
        rendererServiceRegistrations();
        workbenchShortcutRegistrations();
        workbenchCommandRegistrations();
    }
}
{ };

renderer.run();