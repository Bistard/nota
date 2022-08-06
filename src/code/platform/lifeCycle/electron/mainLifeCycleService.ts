import { app, BrowserWindow } from "electron";
import { Disposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { Blocker, delayFor } from "src/base/common/util/async";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IMainLifeCycleService = createDecorator<IMainLifeCycleService>('life-cycle-service');

/**
 * Represents the different phases of the whole application. Notices that the
 * phse cannot go BACKWARDS.
 */
export const enum LifeCyclePhase {
    /**
     * The starting phase of the application (services are not ready).
     */
    Starting = 0,

    /**
     * First window is about to open (services are ready).
     */
    Ready = 1,

    /**
     * After the window has opened. 
     * @note This is usually used when starting services that do not require 
     * the window to be opened.
     */
    Idle = 2,
}

export const enum QuitReason {
    /**
     * The application quit normally.
     */
    Quit,

    /**
     * The application exit abnormally and killed with an exit code.
     */
    Kill,
}

export interface IBeforeQuitEvent {
    /**
     * The reason of the quit event.
     */
    readonly reason: QuitReason;

    /**
     * A method that allows the listener to join the whole process.
     */
    readonly join: (participant: Promise<void>) => void;
}

/**
 * An interface only for {@link MainLifeCycleService}.
 */
export interface IMainLifeCycleService {
    
    /**
     * Fires before the application decided to quit.
     * @note Fires before 'onWillQuit'.
     */
    readonly onBeforeQuit: Register<void>;

    /**
     * Fires when the application just has decided to quit.
     * @note Allows the other services to do somethings before we actual quit.
     * @note This does not guarantee that all the windows are closed already.
     */
    readonly onWillQuit: Register<IBeforeQuitEvent>;

    /** The current phase of the application. */
    readonly phase: LifeCyclePhase;

    /**
     * @description // TODO
     * @param newPhase 
     */
    setPhase(newPhase: LifeCyclePhase): void;

    /**
     * @description // TODO
     * @param desiredPhase 
     */
    when(desiredPhase: LifeCyclePhase): Promise<void>;

    /**
     * @description // TODO
     */
    quit(): Promise<void>;

    /**
     * @description // TODO
     * @param exitcode The exiting code.
     * @default exitcode 1
     */
    kill(exitcode?: number): Promise<void>;
}

/**
 * @class // TODO
 */
export class MainLifeCycleService extends Disposable implements IMainLifeCycleService {

    // [field]

    private _phase = LifeCyclePhase.Starting;
    private _phaseBlocker: Map<LifeCyclePhase, Blocker<void>> = new Map();

    /** prevent calling `this.quit()` twice. */
    private _pendingQuitBlocker?: Blocker<void>;

    /** The application is being requested to quit. This may be canceled. */
    private _requestQuit: boolean = false;
    private _ongoingBeforeQuitPromise?: Promise<void>;

    private _windowCount: number = 0;

    // [event]

    private readonly _onBeforeQuit = this.__register(new Emitter<void>());
    public readonly onBeforeQuit = this._onBeforeQuit.registerListener;

    private readonly _onWillQuit = this.__register(new Emitter<IBeforeQuitEvent>());
    public readonly onWillQuit = this._onWillQuit.registerListener;

    // [constructor]

    constructor(@ILogService private readonly logService: ILogService) {
        super();
        this.when(LifeCyclePhase.Ready).then(() => this.__registerListeners());
    }

    // [getter / setter]

    get phase(): LifeCyclePhase { return this._phase; }

    // [pubic methods]

    public setPhase(newPhase: LifeCyclePhase): void {
        if (newPhase < this._phase) {
			throw new Error('Life cycle cannot go backwards');
		}

        if (newPhase === this._phase) {
            return;
        }

        const blocker = this._phaseBlocker.get(this._phase);
        if (blocker) {
            // someone is waiting for us! 
            blocker.resolve();
            this._phaseBlocker.delete(this._phase);
        }
    }

    public async when(desiredPhase: LifeCyclePhase): Promise<void> {
        
        // the phase we are looking for has already passed.
        if (desiredPhase <= this._phase) {
            return;
        }

        let blocker = this._phaseBlocker.get(desiredPhase);
        if (blocker === undefined) {
            blocker = new Blocker<void>();
            this._phaseBlocker.set(desiredPhase, blocker);
        }

        return blocker.waiting();
    }

    public quit(): Promise<void> {
        if (this._pendingQuitBlocker) {
            return this._pendingQuitBlocker.waiting();
        }
        
        this.logService.trace('Main#LifeCycleService#quit()');
        
        this._pendingQuitBlocker = new Blocker<void>();
        const promise = this._pendingQuitBlocker.waiting().then(() => {
            this.logService.trace('Main#LifeCycleService#app.quit()');
            app.quit();
        });

        return promise;
    }

    public async kill(exitcode: number = 1): Promise<void> {
        this.logService.trace('Main#LifeCycleService#kill()');

        // Give the other services a chance to be notified and complete their job.
        await this.__fireOnBeforeQuit(QuitReason.Kill);

        await Promise.race([
            // ensure wait no more than 1s.
            delayFor(1000),
            // try to kill all the windows
            (async () => {
				for (const window of BrowserWindow.getAllWindows()) {
					if (window && !window.isDestroyed()) {
						let closingPromise: Promise<void>;
						if (window.webContents && !window.webContents.isDestroyed()) {
							closingPromise = new Promise(resolve => window.once('closed', resolve));
						} else {
							closingPromise = Promise.resolve();
						}
						window.destroy();
						await closingPromise;
					}
				}
			})()
        ]);
        
        // quit immediately without asking the user.
        app.exit(exitcode);
    }

    // [private helper methods]

    /**
     * @description Register these listeners: 
     *      - app.on('before-quit'),
     *      - app.on('window-all-closed'),
     *      - app.once('will-quit').
     */
    private __registerListeners(): void {

        // #1
        const onWindowAllClosed = () => {
            // Once we subscribe this, we have control on whether to quit the app.
            
            this.logService.trace('Main#LifeCycleService#app.addListener("window-all-closed")');

            // mac: only quit when requested
            if (IS_MAC && this._requestQuit) {
                app.quit();
                return;
            }

            // win / linux: quit when all window are all closed
            app.quit();
        };
        app.addListener('window-all-closed', onWindowAllClosed);

        // #2
        const onBeforeQuitAnyWindows = () => {
            // Fires if the app quit is requested but before any windows is closed.
            
            if (this._requestQuit) {
                return;
            }

            this.logService.trace('Main#LifeCycleService#app.addListener("before-quit")');
            this._requestQuit = true;
            
            this.logService.trace('Main#LifeCycleService#onBeforeQuit.fire()')
            this._onBeforeQuit.fire();

            /**
             * mac: can run without any window open. in that case we fire the 
             * onWillQuit() event directly because there is no veto to be 
             * expected.
             */
			if (IS_MAC && this._windowCount === 0) {
				this.__fireOnBeforeQuit(QuitReason.Quit);
			}
        };
        app.addListener('before-quit', onBeforeQuitAnyWindows);

        // #3
        app.once('will-quit', (event: Electron.Event) => {
            this.logService.trace('Main#LifeCycleService#app.once("will-quit")');

            // Prevent the quit until the promise was resolved
			event.preventDefault();

			
			this.__fireOnBeforeQuit(QuitReason.Quit)
            .finally(() => {

                if (this._pendingQuitBlocker) {
                    this._pendingQuitBlocker.resolve();
                    this._pendingQuitBlocker = undefined;
                }

                /**
                 * We remove all the old listeners so that when we quit again
                 * we will not prevent the next time by calling 'preventDefault()'.
                 */
				app.removeListener('window-all-closed', onWindowAllClosed);
                app.removeListener('before-quit', onBeforeQuitAnyWindows);
				app.quit();
			});
        });
    }

    /**
     * @description We need to notify the other services and give them a chance 
     * to do things before we actual start to quit.
     * @param reason The reason of the quitting.
     * @returns A promise to be wait until all the other listeners are completed.
     */
    private __fireOnBeforeQuit(reason: QuitReason): Promise<void> {

        if (this._ongoingBeforeQuitPromise) {
            return this._ongoingBeforeQuitPromise;
        }

        // notify all listeners
        const participants: Promise<void>[] = [];
        this._onWillQuit.fire({
            reason: reason,
            join: participant => participants.push(participant),
        });

        this._ongoingBeforeQuitPromise = (async () => {
            // we need to ensure all the participants have completed their jobs.
            try {
                await Promise.allSettled(participants);
            } catch (err: any) {
                this.logService.error(err);
            }
        })();

        return this._ongoingBeforeQuitPromise;
    }
}