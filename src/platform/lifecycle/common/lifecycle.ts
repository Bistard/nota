import { Register } from "src/base/common/event";
import { IService } from "src/platform/instantiation/common/decorator";

export interface ILifecycleService<Phase extends number, Reason extends number> extends IService {

    /**
     * Fires before the application / window decided to quit. The participant
     * can decide whether to veto the decision.
     * @note Fires before 'onWillQuit'.
     */
    readonly onBeforeQuit: Register<IOnBeforeQuitEvent<Reason>>;

    /**
     * Fires when the application / window just has decided to quit.
     * @note Allows the other services to do somethings before we actual quit.
     * @note This does not guarantee that all the windows are closed already.
     */
    readonly onWillQuit: Register<IWillQuitEvent<Reason>>;

    /** 
     * The current phase of the application / window. 
     */
    readonly phase: Phase;

    /**
     * @description Set the phase of the whole application / window.
     * @param newPhase The new phase.
     * @throws New phase cannot go backwards, otherwise an error will be thrown.
     */
    setPhase(newPhase: Phase): void;

    /**
     * @description Returns a promise that will be resolved once the required 
     * phase has reached.
     * @param desiredPhase The desired phase waiting to be reached.
     */
    when(desiredPhase: Phase): Promise<void>;

    /**
     * @description Quit the whole application / window.
     */
    quit(): Promise<void>;
}

export interface IOnBeforeQuitEvent<Reason extends number> {
    /**
     * The reason of the quit event.
     */
    readonly reason: Reason;

    /**
     * A method that allows the listener to veto the decision to quit.
     */
    veto(veto: boolean): void;
}

/**
 * Represents the event where the application decides to quit.
 */
export interface IWillQuitEvent<Reason extends number> {
    /**
     * The reason of the quit event.
     */
    readonly reason: Reason;

    /**
     * A method that allows the listener to join the whole process.
     */
    readonly join: (participant: PromiseLike<any>) => void;
}
