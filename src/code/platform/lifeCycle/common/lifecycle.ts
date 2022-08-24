import { Register } from "src/base/common/event";
import { IBeforeQuitEvent } from "src/code/platform/lifeCycle/electron/mainLifecycleService";

export interface ILifecycleService<Phase extends number, Reason extends number> {

    /**
     * Fires before the application / window decided to quit.
     * @note Fires before 'onWillQuit'.
     */
    readonly onBeforeQuit: Register<void>;

    /**
     * Fires when the application / window just has decided to quit.
     * @note Allows the other services to do somethings before we actual quit.
     * @note This does not guarantee that all the windows are closed already.
     */
    readonly onWillQuit: Register<IBeforeQuitEvent<Reason>>;
 
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