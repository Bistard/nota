import { IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";

export interface ICancellable {
	cancel: () => void;
}

/**
 * An interface only for {@link CancellationToken}.
 */
export interface ICancellationToken extends ICancellable, IDisposable {
    
    /**
     * If the token is already cancelled.
     */
    isCancelled(): boolean;

    /**
     * Fires when the token is cancelled.
     */
    readonly onDidCancel: Register<void>;

    /**
     * @description Cancels the current token.
     */
    cancel(): void;

    /**
     * @description Make the token no longer avaliable.
     */
    dispose(): void;
}

/**
 * @class A simple event-driven token that the client may listen to `onDidCancel` 
 * event when the cancellation is requested.
 * 
 * @note A little different than normal emitter, even the token is already 
 * cancelled, listenning to the event will not raise an error, instead, the 
 * callback will be invoked immediately on the next event loop.
 */
export class CancellationToken implements ICancellationToken {

    // [field]

    private _cancelled: boolean;

    // [event]

    private _onCancelled: Emitter<void> | undefined;
    
    // [constructor]
    
    constructor(cancelled?: boolean) {
        this._cancelled = cancelled ?? false;
    }
    
    // [public method]
    
    get onDidCancel(): Register<void> {
        if (this._cancelled) {
            const call = function (callback: any, context?: any) {
                const handle = setTimeout(callback.bind(context), 0);
                return { dispose: () => clearTimeout(handle) };
            };

            return call;
        }
        
        if (!this._onCancelled) {
            this._onCancelled = this._onCancelled ?? new Emitter();
        }
        return this._onCancelled.registerListener;
    }

    public isCancelled(): boolean {
        return this._cancelled;
    }

    public cancel(): void {
        if (!this._cancelled) {
            this._cancelled = true;
            this._onCancelled?.fire();
            this.dispose();
        }
    }

    public dispose(): void {
        this._onCancelled?.dispose();
        this._onCancelled = undefined;
    }
}