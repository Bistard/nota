import { IDisposable } from "src/base/common/dispose";
import { ITask } from "src/base/common/util/async";

export function repeat(count: number, fn: ITask<any>, ...args: any[]): void {
    let i: number;
    for (i = 0; i < count; i++) {
        fn(...args);
    }
}

export class IntervalTimer implements IDisposable {

    private _handle: boolean | NodeJS.Timer;

    constructor() {
        this._handle = false;
    }

    public cancel(): void {
        if (typeof this._handle !== 'boolean') {
            clearInterval(this._handle);
            this._handle = false;
        }
    }

    public set(callback: () => any, ms: number): void {
        this.cancel();
        this._handle = setInterval(() => callback(), ms);
    }

    public dispose(): void {
        this.cancel();
    }

}