import { ILogService } from "src/base/common/logger";
import { IShortcutService } from "src/workbench/services/shortcut/shortcutService";
import { IFileService } from "src/platform/files/common/fileService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { ConfigurationModuleType, IConfigurationService } from "src/platform/configuration/common/configuration";

export interface IBrowser {
    init(): void;
}

export class BrowserInstance implements IBrowser {

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IShortcutService private readonly shortcutService: IShortcutService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) { }

    // [public methods]

    public init(): void {
        this.registerListeners();
        this.lifecycleService.setPhase(LifecyclePhase.Ready);
    }

    // [private helper methods]

    private registerListeners(): void {

        // when the window is ready
        this.lifecycleService.when(LifecyclePhase.Ready)
        .then(() => {
            
            // FIX: will be erased after save, weird.
            this.configurationService.set('hello', 'world', { type: ConfigurationModuleType.User })
            .then(() => {
                console.log((<any>this.configurationService)._configurationHub.inspect().toJSON());
                console.log((<any>this.configurationService)._userConfiguration.getConfiguration().toJSON());
            });

            // save user configurations on quite
            this.lifecycleService.onWillQuit((e) => e.join(this.configurationService.save()));
        });

        // when the window is about to quit
        this.lifecycleService.onWillQuit(e => {
            /**
             * Making sure all the logging message from the browser side is 
             * correctly sending to the main process.
             */
            e.join(this.logService.flush().then(() => this.logService.dispose()));
        });
    }

}