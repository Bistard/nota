
export interface PerfMark {
    readonly stage: string;
    readonly time: number;
}

const _perfRecord: (string | number)[] = [];

/**
 * @description Marks and creates a timestamp for performance check purpose.
 * @param stage The name of the current stage.
 * @example 
 * ```
 * perf('main start');
 * main();
 * perf('main end');
 * ```
 */
export function perf(stage: string): void {
    _perfRecord.push(stage, Date.now());
}

/**
 * @description Returns all the performance stages history data.
 * @example
 * console.log(getPerf());
 * [
 *   { stage: 'main start', time: 1659968897753 },
 *   { stage: 'main end', time: 1659968897769 }
 * ]
 */
export function getPerf(): PerfMark[] {
    const marks: PerfMark[] = [];
    let i = 0;
    for (i = 0; i < _perfRecord.length; i += 2) {
        marks.push({
            stage: _perfRecord[i] as string,
            time: _perfRecord[i + 1]! as number,
        });
    }
    return marks;
}

export function noop(): void {
    // noop
}