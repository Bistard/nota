import { workbenchDefaultShortcutRegistrations } from "src/code/browser/service/workbench/workbench.register";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";

export interface IBrowser {
    init(): void;
}

export class BrowserInstance implements IBrowser {

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {}

    public init(): void {
        this.registerListeners();
        this.lifecycleService.setPhase(LifecyclePhase.Ready);
    }

    public registerListeners(): void {
        this.lifecycleService.when(LifecyclePhase.Ready)
        .then(() => {
            workbenchDefaultShortcutRegistrations(this.instantiationService);
        });
    }

}