import { ILogService } from "src/base/common/logger";
import { JoinablePromise } from "src/base/common/utilities/async";
import { CreateContextKeyExpr } from "src/platform/context/common/contextKeyExpr";
import { IContextService } from "src/platform/context/common/contextService";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { createService } from "src/platform/instantiation/common/decorator";
import { AbstractLifecycleService } from "src/platform/lifecycle/common/abstractLifecycleService";
import { ILifecycleService as ILifecycleServiceInterface } from "src/platform/lifecycle/common/lifecycle";

export const ILifecycleService = createService<IBrowserLifecycleService>('browser-lifecycle-service');

export interface IBrowserLifecycleService extends ILifecycleServiceInterface<LifecyclePhase, QuitReason> {}

/**
 * Represents the different phases of the whole window (renderer process). 
 * @note Phase cannot go BACKWARD.
 */
export const enum LifecyclePhase {
    
    /**
	 * The first phase signals that we are about to startup getting ready.
	 * @note Performing tasks during this phase can delay the display of an 
     *       editor to the user. Make sure your work is necessary here.
	 */
    Starting,

    /**
     * The browser has finished initializing core services. Ready to create the 
     * main user interface.
     * @note Performing tasks during this phase can delay the display of an 
     *       editor to the user. Make sure your work is necessary here.
     */
    Ready,

    /**
     * Indicates that all important visual elements are fully rendered and 
     * displayed to the user.
     */
    Displayed,

    /**
     * Indicates the window has completed restoration back to the original stage.
     * The window now is fully functional.
     */
    Restored,

    /**
     * Reaches after the view, editors are created and some time has passed 
     * (min 2.5 seconds, max 5 seconds).
     * @note Non-critical services or UIs can be created at this phase.
     */
    Idle,
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

export class BrowserLifecycleService extends AbstractLifecycleService<LifecyclePhase, QuitReason> implements IBrowserLifecycleService {

    // [field]

    private _ongoingQuitParticipants?: Promise<void>;

    // [constructor]

    constructor(
        @ILogService logService: ILogService,
        @IHostService private readonly hostService: IBrowserHostService,
        @IContextService private readonly contextService: IContextService,
    ) {
        super('Browser', LifecyclePhase.Starting, parsePhaseToString, logService);
        this.__registerListeners();
    }

    // [public methods]

    public override async quit(): Promise<void> {
        await this.__onBeforeQuit();
        return this.hostService.closeWindow();
    }

    // [private helper methods]

    private async __fireWillQuit(): Promise<void> {

        if (this._ongoingQuitParticipants) {
            return this._ongoingQuitParticipants;
        }

        // notify all listeners
        this.logService.debug('BrowserLifecycleService', 'willQuit...');
        const participants = new JoinablePromise();
        this._onWillQuit.fire({
            reason: QuitReason.Quit,
            join: participant => participants.join(participant),
        });

        this._ongoingQuitParticipants = (async () => {
            this.logService.debug('BrowserLifecycleService', 'willQuit settling ongoing participants before quit...');
        
            const results = await participants.allSettled();
            results.forEach(res => {
                if (res.status === 'rejected') {
                    this.logService.error('BrowserLifecycleService', '`onWillQuit` participant fails.', res.reason);
                }
            });

            this.logService.debug('BrowserLifecycleService', 'willQuit participants all settled.');
        })();

        await this._ongoingQuitParticipants;
        this._ongoingQuitParticipants = undefined;
    }

    private async __onBeforeQuit(): Promise<void> {
        this.logService.debug('BrowserLifecycleService', 'quit...');

        this.logService.debug('BrowserLifecycleService', 'beforeQuit...');
        this._onBeforeQuit.fire();

        await this.__fireWillQuit();

        this.logService.debug('BrowserLifecycleService', 'Application is about to quit...');

        /**
         * Making sure all the logging message from the browser side is 
         * correctly sending to the main process.
         */
        await this.logService.flush();
    }

    private _preventedOnce = false;
    private __registerListeners(): void {
        window.addEventListener('beforeunload', e => {
            if (!this._preventedOnce) {
                this._preventedOnce = true;
                e.preventDefault();
                
                /**
                 * When listening to 'beforeunload' event, the browser cannot
                 * distinguish between 'reloadWebPage' and 'process quitting'.
                 * 
                 * We need to manually check which is which.
                 */
                this.__onBeforeQuit().then(() => {
                    const isReloadExpr = CreateContextKeyExpr.Equal('reloadWeb', true);
                    const reloading = this.contextService.contextMatchExpr(isReloadExpr);

                    if (reloading) {
                        this.hostService.reloadWebPage();
                    } else {
                        this.hostService.closeWindow();
                    }
                });
            }
        });
    }
}

function parsePhaseToString(phase: LifecyclePhase): string {
    switch (phase) {
        case LifecyclePhase.Starting: return 'Starting';
        case LifecyclePhase.Ready: return 'Ready';
        case LifecyclePhase.Displayed: return 'Displayed';
        case LifecyclePhase.Restored: return 'Restored';
        case LifecyclePhase.Idle: return 'Idle';
    }
}