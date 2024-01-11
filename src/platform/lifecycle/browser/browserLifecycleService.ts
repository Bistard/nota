import { ILogService } from "src/base/common/logger";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { createService } from "src/platform/instantiation/common/decorator";
import { AbstractLifecycleService } from "src/platform/lifecycle/common/abstractLifecycleService";
import { ILifecycleService as ILifecycleServiceInterface } from "src/platform/lifecycle/common/lifecycle";

export const ILifecycleService = createService<IBrowserLifecycleService>('browser-lifecycle-service');

export interface IBrowserLifecycleService extends ILifecycleServiceInterface<LifecyclePhase, QuitReason> { }

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

    // [field]

    private _ongoingQuitPromise?: Promise<void>;

    // [constructor]

    constructor(
        @ILogService logService: ILogService,
        @IHostService private readonly hostService: IBrowserHostService,
    ) {
        super('Browser', LifecyclePhase.Starting, parsePhaseToString, logService);
    }

    // [public methods]

    public override async quit(): Promise<void> {
        this.logService.trace('BrowserLifecycleService', 'quit');

        this.logService.trace('BrowserLifecycleService', 'beforeQuit');
        this._onBeforeQuit.fire();

        await this.__fireWillQuit();

        return this.hostService.closeWindow();
    }

    // [private helper methods]

    private async __fireWillQuit(): Promise<void> {

        if (this._ongoingQuitPromise) {
            return this._ongoingQuitPromise;
        }

        // notify all listeners
        this.logService.trace('BrowserLifecycleService', 'willQuit');
        const participants: PromiseLike<unknown>[] = [];
        this._onWillQuit.fire({
            reason: QuitReason.Quit,
            join: participant => participants.push(participant),
        });

        this._ongoingQuitPromise = (async () => {
            // we need to ensure all the participants have completed their jobs.
            try {
                this.logService.trace('BrowserLifecycleService', 'willQuit AllSettled on-going...');
                await Promise.allSettled(participants);
            } catch (error: any) {
                this.logService.error('BrowserLifecycleService', 'participants error encountered.', error);
            }
        })();

        await this._ongoingQuitPromise;
        this._ongoingQuitPromise = undefined;
    }
}

function parsePhaseToString(phase: LifecyclePhase): string {
    switch (phase) {
        case LifecyclePhase.Starting: return 'Starting';
        case LifecyclePhase.Ready: return 'Ready';
    }
}