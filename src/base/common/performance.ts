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
    
    export namespace Sync {
        
        /**
         * Measures the execution time of a function.
         * 
         * @param name The name stage of this measurement.
         * @param fn The function to measure.
         * @param threshold A warning will be log out when the fn execution exceed the 
         *                  threshold.
         */
        export function measurePerf(name: string, fn: () => void, threshold?: Time): IPerfMark {
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
        export function comparePerf(
            name1: string, fn1: () => void, 
            name2: string, fn2: () => void, 
            threshold?: Time, toLog?: boolean,
        ): IPerfCompareResult 
        {
            const perfMark1 = measurePerf(name1, fn1, threshold);
            const perfMark2 = measurePerf(name2, fn2, threshold);

            const fasterFunction = perfMark1.time < perfMark2.time ? name1 : name2;
            const fasterBy = perfMark1.time < perfMark2.time
                ? perfMark2.time - perfMark1.time
                : perfMark1.time - perfMark2.time;
            
            if (toLog) {
                console.log(`'${name1}' execution time: ${perfMark1.time}ms`);
                console.log(`'${name2}' execution time: ${perfMark2.time}ms`);
                console.log(`'${fasterFunction}' is faster by '${fasterBy}'ms.`);
            }

            return {
                whoIsFaster: fasterFunction,
                fasterBy: fasterBy,
                fn1: perfMark1,
                fn2: perfMark2,
            };
        }

        /**
         * @description Compares the execution time of two synchronous functions 
         * over a number of iterations and logs the fastest and slowest 
         * iterations for each function.
         */
        export function comparePerfInIterations(
            name1: string, fn1: () => void, 
            name2: string, fn2: () => void, 
            iterations: number, threshold?: Time, toLog?: boolean,
        ): IPerfIterationResults
        {
            const results1: IPerfMark[] = [];
            const results2: IPerfMark[] = [];
            let fastest1 = Number.MAX_VALUE, slowest1 = 0; 
            let fastest2 = Number.MAX_VALUE, slowest2 = 0;

            for (let i = 0; i < iterations; i++) {
                const result1 = measurePerf(`${name1} iteration ${i + 1}`, fn1, threshold);
                results1.push(result1);
                if (result1.time < fastest1) fastest1 = result1.time;
                if (result1.time > slowest1) slowest1 = result1.time;

                const result2 = measurePerf(`${name2} iteration ${i + 1}`, fn2, threshold);
                results2.push(result2);
                if (result2.time < fastest2) fastest2 = result2.time;
                if (result2.time > slowest2) slowest2 = result2.time;
            }

            const total1 = results1.reduce((acc, mark) => acc + mark.time, 0);
            const total2 = results2.reduce((acc, mark) => acc + mark.time, 0);

            const averageTime1 = total1 / iterations;
            const averageTime2 = total2 / iterations;

            const fasterFunction = averageTime1 < averageTime2 ? name1 : name2;
            if (toLog) {
                console.log(`${name1} average execution time: ${averageTime1}ms, fastest: ${fastest1}ms, slowest: ${slowest1}ms`);
                console.log(`${name2} average execution time: ${averageTime2}ms, fastest: ${fastest2}ms, slowest: ${slowest2}ms`);
                console.log(`${fasterFunction} is faster on average.`);
            }

            return { 

                whoIsFaster: fasterFunction,

                fn1: {
                    results: results1,
                    averageTime: averageTime1,
                    fastestTime: fastest1,
                    slowestTime: slowest1,
                },
                
                fn2: {
                    results: results2,
                    averageTime: averageTime2,
                    fastestTime: fastest2,
                    slowestTime: slowest2,
                },
             };
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
        export async function measurePerfAsync(name: string, fn: () => Promise<void>, threshold?: Time): Promise<IPerfMark> {
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
        export async function comparePerfAsync(
            name1: string, fn1: () => Promise<void>, 
            name2: string, fn2: () => Promise<void>, 
            threshold?: Time, toLog?: boolean,
        ): Promise<IPerfCompareResult> 
        {
            const perfMark1 = await measurePerfAsync(name1, fn1, threshold);
            const perfMark2 = await measurePerfAsync(name2, fn2, threshold);

            const fasterFunction = perfMark1.time < perfMark2.time ? name1 : name2;
            const fasterBy = perfMark1.time < perfMark2.time
                ? perfMark2.time - perfMark1.time
                : perfMark1.time - perfMark2.time;
            
            if (toLog) {
                console.log(`'${name1}' execution time: ${perfMark1.time}ms`);
                console.log(`'${name2}' execution time: ${perfMark2.time}ms`);
                console.log(`'${fasterFunction}' is faster by '${fasterBy}'ms.`);
            }

            return {
                whoIsFaster: fasterFunction,
                fasterBy: fasterBy,
                fn1: perfMark1,
                fn2: perfMark2,
            };
        }

        /**
         * @description Compares the execution time of two synchronous functions 
         * over a number of iterations and logs the fastest and slowest 
         * iterations for each function.
         */
        export async function comparePerfInIterationsAsync(
            name1: string, fn1: () => Promise<void>, 
            name2: string, fn2: () => Promise<void>, 
            iterations: number, threshold?: Time, toLog?: boolean,
        ): Promise<IPerfIterationResults>
        {
            const results1: IPerfMark[] = [];
            const results2: IPerfMark[] = [];
            let fastest1 = Number.MAX_VALUE, slowest1 = 0; 
            let fastest2 = Number.MAX_VALUE, slowest2 = 0;

            for (let i = 0; i < iterations; i++) {
                const result1 = await measurePerfAsync(`${name1} iteration ${i + 1}`, fn1, threshold);
                results1.push(result1);
                if (result1.time < fastest1) fastest1 = result1.time;
                if (result1.time > slowest1) slowest1 = result1.time;

                const result2 = await measurePerfAsync(`${name2} iteration ${i + 1}`, fn2, threshold);
                results2.push(result2);
                if (result2.time < fastest2) fastest2 = result2.time;
                if (result2.time > slowest2) slowest2 = result2.time;
            }

            const total1 = results1.reduce((acc, mark) => acc + mark.time, 0);
            const total2 = results2.reduce((acc, mark) => acc + mark.time, 0);

            const averageTime1 = total1 / iterations;
            const averageTime2 = total2 / iterations;

            const fasterFunction = averageTime1 < averageTime2 ? name1 : name2;
            if (toLog) {
                console.log(`${name1} average execution time: ${averageTime1}ms, fastest: ${fastest1}ms, slowest: ${slowest1}ms`);
                console.log(`${name2} average execution time: ${averageTime2}ms, fastest: ${fastest2}ms, slowest: ${slowest2}ms`);
                console.log(`${fasterFunction} is faster on average.`);
            }

            return { 

                whoIsFaster: fasterFunction,

                fn1: {
                    results: results1,
                    averageTime: averageTime1,
                    fastestTime: fastest1,
                    slowestTime: slowest1,
                },
                
                fn2: {
                    results: results2,
                    averageTime: averageTime2,
                    fastestTime: fastest2,
                    slowestTime: slowest2,
                },
            };
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

    export interface IPerfCompareResult {
        readonly whoIsFaster: string;
        readonly fasterBy: number;
        readonly fn1: IPerfMark;
        readonly fn2: IPerfMark;
    }

    export interface IPerfIterationResults {
        
        readonly whoIsFaster: string;

        readonly fn1: {
            readonly results: IPerfMark[];
            readonly averageTime: number; 
            readonly fastestTime: number;
            readonly slowestTime: number;
        };
        
        readonly fn2: {
            readonly results: IPerfMark[];
            readonly averageTime: number; 
            readonly fastestTime: number;
            readonly slowestTime: number;
        };
    }
}