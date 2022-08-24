import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifeCycle/browser/browserLifecycleService";

export interface IBrowser {

    init(): void;

}

export class Browser implements IBrowser {

    constructor(
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {}

    public init(): void {
        this.lifecycleService.setPhase(LifecyclePhase.Ready);
    }

}