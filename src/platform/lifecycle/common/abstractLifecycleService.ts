import { Disposable } from "src/base/common/dispose";
import { Emitter } from "src/base/common/event";
import { ILogService } from "src/base/common/logger";
import { Blocker } from "src/base/common/utilities/async";
import { panic } from "src/base/common/utilities/panic";
import { IWillQuitEvent, ILifecycleService, IOnBeforeQuitEvent } from "src/platform/lifecycle/common/lifecycle";

export abstract class AbstractLifecycleService<Phase extends number, QuitReason extends number> extends Disposable implements ILifecycleService<Phase, QuitReason> {

    declare _serviceMarker: undefined;

    // [field]

    private _phase: Phase;
    private _phaseBlocker: Map<Phase, Blocker<void>> = new Map();

    // [event]

    protected readonly _onBeforeQuit = this.__register(new Emitter<IOnBeforeQuitEvent<QuitReason>>());
    public readonly onBeforeQuit = this._onBeforeQuit.registerListener;

    protected readonly _onWillQuit = this.__register(new Emitter<IWillQuitEvent<QuitReason>>());
    public readonly onWillQuit = this._onWillQuit.registerListener;

    // [constructor]

    constructor(
        private readonly type: string,
        initPhase: Phase,
        protected readonly parsePhaseToString: (phase: Phase) => string,
        protected readonly logService: ILogService,
    ) {
        super();
        this._phase = initPhase;
        this.logService.debug(`${type}LifecycleService`, `Process reaching at phase: ${this.parsePhaseToString(initPhase)}`);
    }

    // [public abstract method]

    public abstract quit(): Promise<void>;

    // [getter / setter]

    get phase(): Phase { return this._phase; }

    // [public methods]

    public setPhase(newPhase: Phase): void {
        if (newPhase < this._phase) {
            panic('Life cycle cannot go backwards');
        }

        if (newPhase === this._phase) {
            return;
        }

        this._phase = newPhase;
        const blocker = this._phaseBlocker.get(newPhase);
        if (blocker) {
            // someone is waiting for us! 
            blocker.resolve();
            this._phaseBlocker.delete(newPhase);
        }

        this.logService.debug(`${this.type}LifecycleService`, `Process reaching at phase: ${this.parsePhaseToString(newPhase)}`);
    }

    public async when(desiredPhase: Phase): Promise<void> {

        /**
         * The phase we are looking for has already passed (even we are at the 
         * current phase).
         */
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
}