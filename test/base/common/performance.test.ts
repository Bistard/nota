import * as assert from 'assert';
import { PerfUtils } from 'src/base/common/performance';
import { Arrays } from 'src/base/common/utilities/array';
import { deepCopy } from 'src/base/common/utilities/object';

/**
 * This is an empty suite. Act like a placeholder that you may write any testing 
 * code convinently during your development.
 */
suite('performance-test', () => {
    
    // test('Arrays.remove', () => {
        // function generateRandomArguments() {
        //     const arrayLength = Math.floor(Math.random() * 10000000) + 100000; // Generate array of random length (10 to 110)
        //     const array = Array.from({ length: arrayLength }, () => Math.floor(Math.random() * 100)); // Populate array with random integers
        
        //     const itemIndex = Math.floor(Math.random() * arrayLength); // Select a random index to remove
        //     const item = array[itemIndex]; // Get the item at the selected index
        
        //     return [array, item] as const;
        // }
        
        // function remove2<T>(array: T[], item: T, index?: number): T[] {
        //     const set = new Set(array);
        //     set.delete(item);
        //     return Arrays.fromSet(set);
        // }

        // PerfUtils.Sync.compareInIterations(
        //     'Arrays.remove',
        //     () => Arrays.remove(...generateRandomArguments()),
        //     'remove2',
        //     () => remove2(...generateRandomArguments()),
        //     10,
        //     { toLog: true, }
        // );
    // });

    // test('Arrays.insertByIndex', () => {
    //     const generateRandomTestArguments = () => {
    //         const base = 5;
    //         const up = 100;
    //         const arrayLength = Math.floor(Math.random() * up) + base;
    //         const array = Array.from({ length: arrayLength }, () => Math.floor(Math.random() * 100));
    
    //         const indices: number[] = [];
    //         const elements: number[][] = [];
    //         for (let i = 0; i < 100; i++) { // Generate X random indices and elements
    //             indices.push(Math.floor(Math.random() * arrayLength));
    //             elements.push([Math.floor(Math.random() * 100)]); // Elements are arrays with one random integer
    //         }
    
    //         return [array, indices, elements] as const;
    //     };

    //     const __gen = (): [number[], number, number[]] => {
    //         const base = 5;
    //         const up = 10000;
    //         const arrayLength = Math.floor(Math.random() * up) + base;
    //         const array = Array.from({ length: arrayLength }, () => Math.floor(Math.random() * 100));
    
    //         const index: number = Math.floor(Math.random() * arrayLength); // Generate X random indices and elements
    //         const elements: number[] = []; // Elements are arrays with one random integer
            
    //         for (let i = 0; i < 1000; i++) { 
    //             elements.push(Math.floor(Math.random() * 1000)); 
    //         }
    
    //         return [array, index, elements];
    //     };

    //     function arrayInsert<T>(target: T[], insertIndex: number, insertArr: T[]): T[] {
    //         const before = target.slice(0, insertIndex!);
    //         const after = target.slice(insertIndex!);
    //         return before.concat(insertArr!, after);
    //     }

    //     function getActualStartIndex<T>(array: T[], start: number): number {
    //         return start < 0 ? Math.max(start + array.length, 0) : Math.min(start, array.length);
    //     }

    //     function insertInto<T>(array: T[], start: number, newItems: T[]): void {
    //         const startIdx = getActualStartIndex(array, start);
    //         const originalLength = array.length;
    //         const newItemsLength = newItems.length;
    //         array.length = originalLength + newItemsLength;
            
    //         // Move the items after the start index, start from the end so that we don't overwrite any value.
    //         for (let i = originalLength - 1; i >= startIdx; i--) {
    //             array[i + newItemsLength] = array[i]!;
    //         }
        
    //         for (let i = 0; i < newItemsLength; i++) {
    //             array[i + startIdx] = newItems[i]!;
    //         }
    //     }

    //     function getArgFromSingleToMuti() {
    //         const arg = __gen();
    //         return [arg[0]!, [arg[1]!] as number[], [arg[2]!] as number[][] ] as const;
    //     }

    //     function getArgFromMutiToSingle() {
    //         const args = generateRandomTestArguments();
    //         return [args[0]!, args[1][0]!, args[2][0]!] as const;
    //     }

    //     const rawArgs = getArgFromSingleToMuti();


    //     PerfUtils.Sync.compareInIterations(
    //         [
    //             {
    //                 name: 'insertByIndex',
    //                 fn: (...args) => {
    //                     Arrays.insertByIndex(args[0]!, [args[1]!], [args[2]!]);
    //                 },
    //             }, 
    //             {
    //                 name: 'arrayInsert',
    //                 fn: arrayInsert,
    //             }, 
    //             {
    //                 name: 'insertInto',
    //                 fn: insertInto,
    //             }
    //         ],
    //         () => __gen(),
    //         100,
    //         {
    //             toLog: true,
    //             timePrecision: 6,
    //         }
    //     );
    // });
});