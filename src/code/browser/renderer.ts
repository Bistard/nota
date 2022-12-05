import { Workbench } from "src/code/browser/workbench/workbench";
import { registerBrowserDefaultConfiguration } from "src/code/platform/configuration/browser/configuration.register";
import { rendererServiceRegistrations } from "src/code/browser/service.register";
import { workbenchShortcutRegistrations } from "src/code/browser/service/workbench/shortcut.register";
import { workbenchCommandRegistrations } from "src/code/browser/service/workbench/command.register";
import { IInstantiationService, InstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { getSingletonServiceDescriptors, ServiceCollection } from "src/code/platform/instantiation/common/serviceCollection";
import { waitDomToBeLoad } from "src/base/browser/basic/dom";
import { ComponentService, IComponentService } from "src/code/browser/service/component/componentService";
import { Disposable } from "src/base/common/dispose";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { initExposedElectronAPIs } from "src/code/platform/electron/browser/global";
import { IIpcService, IpcService } from "src/code/platform/ipc/browser/ipcService";
import { BrowserLoggerChannel } from "src/code/platform/logger/common/loggerChannel";
import { BufferLogger, ILogService, LogLevel, PipelineLogger } from "src/base/common/logger";
import { ILoggerService } from "src/code/platform/logger/common/abstractLoggerService";
import { IFileService } from "src/code/platform/files/common/fileService";
import { BrowserEnvironmentService } from "src/code/platform/environment/browser/browserEnvironmentService";
import { BrowserFileChannel } from "src/code/platform/files/browser/fileChannel";
import { ErrorHandler } from "src/base/common/error";
import { ApplicationMode, IBrowserEnvironmentService } from "src/code/platform/environment/common/environment";
import { ConsoleLogger } from "src/code/platform/logger/common/consoleLoggerService";
import { getFormatCurrTimeStamp } from "src/base/common/date";
import { IConfigService } from "src/code/platform/configuration/common/abstractConfigService";
import { BrowserConfigService } from "src/code/platform/configuration/browser/browserConfigService";
import { ProxyChannel } from "src/code/platform/ipc/common/proxy";
import { IpcChannel } from "src/code/platform/ipc/common/channel";
import { IHostService } from "src/code/platform/host/common/hostService";
import { IBrowserHostService } from "src/code/platform/host/browser/browserHostService";
import { BrowserLifecycleService, ILifecycleService } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { i18n, Ii18nOpts, Ii18nService, LanguageType } from "src/code/platform/i18n/i18n";
import { BuiltInConfigScope } from "src/code/platform/configuration/common/configRegistrant";
import { BrowserInstance } from "src/code/browser/browser";

/**
 * @class This is the main entry of the renderer process.
 */
class RendererInstance extends Disposable {

    // [constructor]

    constructor() {
        super();
        this.run();
    }
    
    // [private methods]

    private async run(): Promise<void> {
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
            const workbench = instantiaionService.createInstance(Workbench, document.body);
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
                } catch {}
            }
            ErrorHandler.onUnexpectedError(error);
        }
    }

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
        const loggerService = new BrowserLoggerChannel(ipcService, environmentService.logLevel);
        instantiationService.register(ILoggerService, loggerService);

        // logger
        const logger = new PipelineLogger([
            // console-logger
            new ConsoleLogger(environmentService.mode === ApplicationMode.DEVELOP ? environmentService.logLevel : LogLevel.WARN),
            // file-logger
            loggerService.createLogger(environmentService.logPath, { 
                name: `wind-${environmentService.windowID}-${getFormatCurrTimeStamp()}.txt`,
                description: `renderer`,
            }),
        ]);
        logService.setLogger(logger);
        
        // file-service
        const fileService = new BrowserFileChannel(ipcService);
        instantiationService.register(IFileService, fileService);
 
        // browser-configuration-service
        const configService = new BrowserConfigService(environmentService, fileService, logService, lifecycleService);
        instantiationService.register(IConfigService, configService);
        
        // component-service
        instantiationService.register(IComponentService, new ServiceDescriptor(ComponentService));

        // i18n-service
        // REVIEW: late initialization
        const i18nOption: Ii18nOpts = {
            language: configService.get<LanguageType>(BuiltInConfigScope.User, 'workbench.language'),
            localeOpts: {}
        };
        const i18nService = new i18n(i18nOption, fileService, logService);
        instantiationService.register(Ii18nService, i18nService);

        // singleton initializations
        for (const [serviceIdentifer, serviceDescriptor] of getSingletonServiceDescriptors()) {
			instantiationService.register(serviceIdentifer, serviceDescriptor);
		}

        return instantiationService;
    }

    private async initServices(instantiaionService: IInstantiationService): Promise<any> {
        const environmentService = instantiaionService.getService(IBrowserEnvironmentService)
        const configService = instantiaionService.getService(IConfigService);
        const i18nService = instantiaionService.getService(Ii18nService);

        return Promise.all<any>([
            configService.init(environmentService.logLevel),
            i18nService.init(),
        ]);
    }

    private initRegistrations(): void {
        rendererServiceRegistrations();
        registerBrowserDefaultConfiguration();
        workbenchShortcutRegistrations();
        workbenchCommandRegistrations();
    }
}

new RendererInstance();
