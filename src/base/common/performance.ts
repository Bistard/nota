/* eslint-disable no-inner-declarations */
import { Time } from "src/base/common/date";
import { Disposable, IDisposable, toDisposable } from "src/base/common/dispose";

export interface IPerfMark {
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
 * @note You may refresh the records by call {@link clearPerf}.
 * 
 * @example
 * console.log(getPerf());
 * [
 *   { stage: 'main start', time: 1659968897753 },
 *   { stage: 'main end', time: 1659968897769 }
 * ]
 */
export function getPerf(): IPerfMark[] {
    const marks: IPerfMark[] = [];
    let i = 0;
    for (i = 0; i < _perfRecord.length; i += 2) {
        marks.push({
            stage: _perfRecord[i] as string,
            time: _perfRecord[i + 1]! as number,
        });
    }
    return marks;
}

/**
 * @description Clear Performance Records.
 */
export function clearPerf(): void {
    _perfRecord.length = 0;
}

/**
 * @description No operations. Act like a placeholder.
 */
export function noop(): void {
    // noop
}

/**
 * @namespace PerfUtils Provides a suite of performance measurement and 
 * comparison utilities designed for both synchronous and asynchronous functions. 
 * 
 * @see PerfUtils.Sync
 * @see PerfUtils.Async
 */
export namespace PerfUtils {

    export interface IPerfCompareResult {
        readonly fastest: string;
        readonly fasterBy: number;
        readonly fn1: IPerfMark;
        readonly fn2: IPerfMark;
    }

    interface IPerfIterationResult {
        readonly name: string;
        readonly results: IPerfMark[];
        readonly averageTime: number; 
        readonly fastestTime: number;
        readonly slowestTime: number;
        readonly totalTime: number;
    }

    export interface IPerfIterationResults {
        readonly fastest: IPerfIterationResult;
        readonly results: IPerfIterationResult[];
    }

    /**
     * Options type for:
     *      - {@link PerfUtils.Sync.compareInIterations}
     *      - {@link PerfUtils.Async.compareInIterations}
     */
    export interface IPerfIterationOptions {
        
        /**
         * The threshold when reaches a warning message will be logged.
         * @default undefined
         */
        readonly threshold?: Time; 
        
        /**
         * If to log the message;
         * @default false
         */
        readonly toLog?: boolean;

        /**
         * The number of decimal places to use when logging messages. Must be in
         * a range of 0 to 20.
         * @default 6
         */
        readonly timePrecision?: number;
    }

    export namespace Sync {
        
        /**
         * Measures the execution time of a function.
         * 
         * @param name The name stage of this measurement.
         * @param fn The function to measure.
         * @param threshold A warning will be log out when the fn execution exceed the 
         *                  threshold.
         */
        export function measure(name: string, fn: () => void, threshold?: Time): IPerfMark {
            const timeout = __setThresHold(name, threshold);
            
            const startTime = performance.now();
            fn();
            const endTime = performance.now();

            timeout.dispose();

            return {
                stage: name,
                time: endTime - startTime,
            };
        }

        /**
         * @description Compares the execution time of two synchronous functions.
         */
        export function compare(
            name1: string, fn1: () => void, 
            name2: string, fn2: () => void, 
            threshold?: Time, toLog?: boolean,
        ): IPerfCompareResult 
        {
            const perfMark1 = measure(name1, fn1, threshold);
            const perfMark2 = measure(name2, fn2, threshold);

            const fasterFn = perfMark1.time < perfMark2.time ? name1 : name2;
            const fasterBy = Math.abs(perfMark1.time - perfMark2.time);

            const result = {
                fastest: fasterFn,
                fasterBy: fasterBy,
                fn1: perfMark1,
                fn2: perfMark2,
            };

            if (toLog) {
                __logPerfCompareResult(result);
            }

            return result;
        }

        /**
         * @description Compares the execution time of multiple synchronous 
         * functions over a number of iterations and logs the performance 
         * metrics for each function.
         */
        export function compareInIterations<TArgs extends any[]>(
            functions: { name: string; fn: (...args: TArgs) => void }[],
            getArgs: () => TArgs,
            iterations: number,
            opts?: IPerfIterationOptions
        ): IPerfIterationResults
        {
            const results = functions.map(func => ({
                name: func.name,
                results: [] as IPerfMark[],
                fastestTime: Number.MAX_VALUE,
                slowestTime: 0,
                totalTime: 0
            }));

            for (let i = 0; i < iterations; i++) {
                const args = getArgs();

                functions.forEach((func, index) => {
                    const composeFn = () => func.fn(...args);
                    const result = measure(`${func.name} - ${i + 1}`, composeFn, opts?.threshold);
                    const cache = results[index]!;

                    cache.results.push(result);
                    cache.totalTime += result.time;
                    if (result.time < cache.fastestTime) cache.fastestTime = result.time;
                    if (result.time > cache.slowestTime) cache.slowestTime = result.time;
                });
            }

            let fastest!: IPerfIterationResult;
            let fastestTime = Number.MAX_VALUE;
            
            const finalResults: IPerfIterationResult[] = [];

            for (const result of results) {
                const averageTime = result.totalTime / iterations;
                const resolved = { ...result, averageTime, };
                finalResults.push(resolved);

                if (averageTime < fastestTime) {
                    fastest = resolved;
                    fastestTime = averageTime;
                }
            }

            const result = { 
                fastest: fastest, 
                results: finalResults,
            };

            if (opts?.toLog) {
                __logPerfIterationResults(result, opts?.timePrecision);
            }

            return result;
        }
    }
    
    export namespace Async {

        /**
         * @description Measures the execution time of a function asynchronously.
         * @param name The name stage of this measurement.
         * @param fn The async function to measure.
         * @param threshold A warning will be log out when the fn execution exceed the 
         *                  threshold.
         */
        export async function measure(name: string, fn: () => Promise<void>, threshold?: Time): Promise<IPerfMark> {
            const timeout = __setThresHold(name, threshold);

            const startTime = performance.now();
            await fn();
            const endTime = performance.now();

            timeout.dispose();

            return {
                stage: name,
                time: endTime - startTime,
            };
        }

        /**
         * @description Compares the execution time of two asynchronous functions.
         */
        export async function compare(
            name1: string, fn1: () => Promise<void>, 
            name2: string, fn2: () => Promise<void>, 
            threshold?: Time, toLog?: boolean,
        ): Promise<IPerfCompareResult> 
        {
            const perfMark1 = await measure(name1, fn1, threshold);
            const perfMark2 = await measure(name2, fn2, threshold);

            const fasterFn = perfMark1.time < perfMark2.time ? name1 : name2;
            const fasterBy = Math.abs(perfMark1.time - perfMark2.time);

            const result = {
                fastest: fasterFn,
                fasterBy: fasterBy,
                fn1: perfMark1,
                fn2: perfMark2,
            };

            if (toLog) {
                __logPerfCompareResult(result);
            }

            return result;
        }

        /**
         * @description Compares the execution time of multiple asynchronous 
         * functions over a number of iterations and logs the performance 
         * metrics for each function.
         */
        export async function compareInIterations<TArgs extends any[]>(
            functions: { name: string; fn: (...args: TArgs) => Promise<void> }[],
            getArgs: () => TArgs,
            iterations: number,
            opts?: IPerfIterationOptions
        ): Promise<IPerfIterationResults>
        {
            const results = functions.map(func => ({
                name: func.name,
                results: [] as IPerfMark[],
                fastestTime: Number.MAX_VALUE,
                slowestTime: 0,
                totalTime: 0
            }));

            for (let i = 0; i < iterations; i++) {
                const args = getArgs();

                await Promise.all(functions.map(async (func, index) => {
                    const composeFn = () => func.fn(...args);
                    const result = await measure(`${func.name} - ${i + 1}`, composeFn, opts?.threshold);
                    const cache = results[index]!;

                    cache.results.push(result);
                    cache.totalTime += result.time;
                    if (result.time < cache.fastestTime) cache.fastestTime = result.time;
                    if (result.time > cache.slowestTime) cache.slowestTime = result.time;
                }));
            }

            let fastest!: IPerfIterationResult;
            let fastestTime = Number.MAX_VALUE;
            
            const finalResults: IPerfIterationResult[] = [];

            for (const result of results) {
                const averageTime = result.totalTime / iterations;
                const resolved = { ...result, averageTime, };
                finalResults.push(resolved);

                if (averageTime < fastestTime) {
                    fastest = resolved;
                    fastestTime = averageTime;
                }
            }

            const result = { 
                fastest: fastest, 
                results: finalResults,
            };

            if (opts?.toLog) {
                __logPerfIterationResults(result, opts?.timePrecision);
            }

            return result;
        }
    }

    function __setThresHold(name: string, threshold?: Time): IDisposable {
        if (!threshold) {
            return Disposable.NONE;
        }
        
        const token = setTimeout(() => console.warn(`The function '${name}' execution time exceeds the threshold: ${threshold.toString()}`));
        return toDisposable(() => {
            clearTimeout(token);
        });
    }

    function __logPerfCompareResult(result: IPerfCompareResult): void {
        console.log('<--- Performance Comparison Result --->');
        
        console.log(`- '${result.fastest}' is faster.`);
        
        const percentageFaster = (result.fasterBy / Math.max(result.fn1.time, result.fn2.time)) * 100;
        console.log(`- Faster by: ${result.fasterBy} ms (${percentageFaster.toFixed(2)}%)`);

        console.log('\n');
        
        console.log(`- ${result.fn1.stage}: ${result.fn1.time} ms`);
        console.log(`- ${result.fn2.stage}: ${result.fn2.time} ms`);
    
    
        console.log('<---             End               --->');
    }

    function __logPerfIterationResults(results: IPerfIterationResults, timePrecision: number = 6): void {
        console.log('<--- Performance Iteration Results --->');
    
        // show fastest
        console.log(`- Overall, '${results.fastest.name}' is fastest on average.`);
        
        
        const fastestAve = results.fastest.averageTime;
        console.log(`- On average, it takes: ${fastestAve.toFixed(timePrecision)} ms`);

        for (const result of results.results) {
            if (result.name === results.fastest.name) {
                continue;
            }

            const avgTimeDiff = result.averageTime - fastestAve;
            const percentageFaster = (avgTimeDiff / result.averageTime) * 100;
            console.log(`- Faster than '${result.name}' by: ${avgTimeDiff.toFixed(timePrecision)} ms  (${percentageFaster.toFixed(2)}%)`);
        }
        
        console.log('\n');

        // every function result
        for (const result of results.results) {
            console.log(`'${result.name}' Metrics:`);
            console.log(`- Total Time: ${result.totalTime.toFixed(timePrecision)} ms`);
            console.log(`- Average Time: ${result.averageTime.toFixed(timePrecision)} ms`);
            console.log(`- Fastest Time: ${result.fastestTime.toFixed(timePrecision)} ms`);
            console.log(`- Slowest Time: ${result.slowestTime.toFixed(timePrecision)} ms`);
            console.log('\n');
        }

        console.log('<---             End               --->');
    }
}