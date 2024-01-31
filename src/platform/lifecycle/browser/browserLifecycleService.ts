import { ILogService } from "src/base/common/logger";
import { JoinablePromise } from "src/base/common/utilities/async";
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

    private _ongoingQuitParticipants?: Promise<void>;

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

        if (this._ongoingQuitParticipants) {
            return this._ongoingQuitParticipants;
        }

        // notify all listeners
        this.logService.trace('BrowserLifecycleService', 'willQuit');
        const participants = new JoinablePromise();
        this._onWillQuit.fire({
            reason: QuitReason.Quit,
            join: participant => participants.join(participant),
        });

        this._ongoingQuitParticipants = (async () => {
            this.logService.trace('BrowserLifecycleService', 'willQuit settling ongoing particiants before quit...');
        
            const results = await participants.allSettled();
            results.forEach(res => {
                if (res.status === 'rejected') {
                    this.logService.error('BrowserLifecycleService', '`onWillQuit` participant fails.', res.reason);
                }
            });

            this.logService.trace('BrowserLifecycleService', 'willQuit particiants all settled.');
            
            /**
             * Making sure all the logging message from the browser side is 
             * correctly sending to the main process.
             */
            await this.logService.flush();
        })();

        await this._ongoingQuitParticipants;
        this._ongoingQuitParticipants = undefined;
    }
}

function parsePhaseToString(phase: LifecyclePhase): string {
    switch (phase) {
        case LifecyclePhase.Starting: return 'Starting';
        case LifecyclePhase.Ready: return 'Ready';
    }
}