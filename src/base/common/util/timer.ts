import { IDisposable } from "src/base/common/dispose";

/**
 * @description Runs the given callback in a given times.
 */
export function repeat(round: number, fn: (index: number) => void): void {
    let i: number;
    for (i = 0; i < round; i++) {
        fn(i);
    }
}

export class IntervalTimer implements IDisposable {

    private _handle?: NodeJS.Timer = undefined;

    constructor() {}

    public cancel(): void {
        if (this._handle) {
            clearInterval(this._handle);
            this._handle = undefined;
        }
    }

    public set(callback: () => void, ms: number): void {
        this.cancel();
        this._handle = setInterval(() => callback(), ms);
    }

    public dispose(): void {
        this.cancel();
    }
}