import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";

export interface IBrowser {

    init(): void;

}

export class BrowserInstance implements IBrowser {

    constructor(
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
    ) {}

    public init(): void {
        this.lifecycleService.setPhase(LifecyclePhase.Ready);

        this.registerListeners();
    }

    public registerListeners(): void {
        
    }

}