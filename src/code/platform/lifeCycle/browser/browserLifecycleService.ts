import { ILogService } from "src/base/common/logger";
import { IBrowserHostService } from "src/code/platform/host/browser/browserHostService";
import { IHostService } from "src/code/platform/host/common/hostService";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { AbstractLifecycleService } from "src/code/platform/lifeCycle/common/abstractLifecycleService";
import { ILifecycleService as ILifecycleServiceInterface } from "src/code/platform/lifeCycle/common/lifecycle";

export const ILifecycleService = createDecorator<IBrowserLifecycleService>('browser-lifecycle-service');

export interface IBrowserLifecycleService extends ILifecycleServiceInterface<LifecyclePhase, QuitReason> {}

export const enum LifecyclePhase {
    Starting,
    Ready,
}

export const enum QuitReason {
    /**
     * The window is closed by users.
     */
    Quit,
    /**
     * The application is closed.
     */
    Kill,
    /**
     * The window is reloaded.
     */
    Reload,
}

export class BrowserLifecycleService extends AbstractLifecycleService<LifecyclePhase, QuitReason> {
    
    constructor(
        @ILogService logService: ILogService,
        @IHostService private readonly hostService: IBrowserHostService,
    ) {
        super('window', LifecyclePhase.Starting, parsePhaseToString, logService);
    }

    public override quit(): Promise<void> {
        return this.hostService.closeWindow();
    }
}

function parsePhaseToString(phase: LifecyclePhase): string {
    switch (phase) {
        case LifecyclePhase.Starting: return 'Starting';
        case LifecyclePhase.Ready: return 'Ready';
    }
}