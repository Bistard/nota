import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";

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
    ) {}

    // [public methods]

    public init(): void {
        this.registerListeners();
        this.lifecycleService.setPhase(LifecyclePhase.Ready);
    }

    // [private helper methods]

    private registerListeners(): void {
        
        // when the window is ready
        this.lifecycleService.when(LifecyclePhase.Ready).then(() => {});

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