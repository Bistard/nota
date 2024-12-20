import { ILogService } from "src/base/common/logger";
import { JoinablePromise } from "src/base/common/utilities/async";
import { ipcRenderer, safeIpcRendererOn } from "src/platform/electron/browser/global";
import { IBrowserHostService } from "src/platform/host/browser/browserHostService";
import { IHostService } from "src/platform/host/common/hostService";
import { createService } from "src/platform/instantiation/common/decorator";
import { IpcChannel } from "src/platform/ipc/common/channel";
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
    ) {
        super('Browser', LifecyclePhase.Starting, parsePhaseToString, logService);
        this.__registerListeners();
    }

    // [public methods]

    public override async quit(): Promise<void> {
        this.logService.debug('BrowserLifecycleService', 'quit...');
        await this.__fireOnBeforeQuit(QuitReason.Quit);
        return this.hostService.closeWindow();
    }

    // [private helper methods]

    private async __fireOnWillQuit(): Promise<void> {
        if (this._ongoingQuitParticipants) {
            return this._ongoingQuitParticipants;
        }

        // notify all listeners
        this.logService.debug('BrowserLifecycleService', 'onWillQuit...');
        const participants = new JoinablePromise();
        this._onWillQuit.fire({
            reason: QuitReason.Quit,
            join: participant => participants.join(participant),
        });

        this._ongoingQuitParticipants = (async () => {
            this.logService.debug('BrowserLifecycleService', '"onWillQuit" settling ongoing participants before quit...');
        
            const results = await participants.allSettled();
            results.forEach(res => {
                if (res.status === 'rejected') {
                    this.logService.error('BrowserLifecycleService', '"onWillQuit" participant fails.', res.reason);
                }
            });

            this.logService.debug('BrowserLifecycleService', '"onWillQuit" participants all settled.');
        })();

        await this._ongoingQuitParticipants;
        this._ongoingQuitParticipants = undefined;
    }

    private async __fireOnBeforeQuit(reason: QuitReason): Promise<boolean> {

        // fire onBeforeQuit, see anyone will veto the decision.
        let veto = false;
        this.logService.debug('BrowserLifecycleService', 'onBeforeQuit...');
        this._onBeforeQuit.fire({
            reason: reason,
            veto: (anyVeto) => veto ||= anyVeto,
        });

        // vetoed by someone, we do nothing.
        if (veto) {
            this.logService.debug('BrowserLifecycleService', 'onBeforeQuit vetoed.');
            return true;
        }

        // not vetoed, we continue to notify will quit event.
        await this.__fireOnWillQuit();

        /**
         * Making sure all the logging message from the browser side is 
         * correctly sending to the main process.
         */
        this.logService.debug('BrowserLifecycleService', 'Application is about to quit...');
        await this.logService.flush();
        return false;
    }

    private __registerListeners(): void {

        /**
         * Listener 'onBeforeUnload', renderer has a chance to decide to veto
         * this decision. Renderer also has a chance to save all the process
         * before quit.
         */
        safeIpcRendererOn(IpcChannel.windowOnBeforeUnload, async (_, { okChannel, vetoChannel }) => {
            const veto = await this.__fireOnBeforeQuit(QuitReason.Reload);
            if (veto) {
                ipcRenderer.send(vetoChannel, 'veto');
            } else {
                ipcRenderer.send(okChannel, 'ok');
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