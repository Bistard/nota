import { EventBlocker } from "src/base/common/util/async";
import { workbenchDefaultShortcutRegistrations } from "src/code/browser/service/workbench/shortcut.register";
import { IFileService } from "src/code/platform/files/common/fileService";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";

export interface IBrowser {
    init(): void;
}

export class BrowserInstance implements IBrowser {

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IFileService private readonly fileService: IFileService,
    ) {}

    public init(): void {
        this.registerListeners();
        this.lifecycleService.setPhase(LifecyclePhase.Ready);
    }

    public registerListeners(): void {
        
        // when the window is ready
        this.lifecycleService.when(LifecyclePhase.Ready)
        .then(() => {
            workbenchDefaultShortcutRegistrations(this.instantiationService);
        });

        // when the window is about to quit
        this.lifecycleService.onWillQuit(e => {
            // e.join(new EventBlocker(this.fileService.onDidAllResourceClosed).waiting());
            // this.fileService.dispose();
        });
    }

}