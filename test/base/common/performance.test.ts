import * as assert from 'assert';
import { PerfUtils } from 'src/base/common/performance';
import { Arrays } from 'src/base/common/utilities/array';
import { deepCopy } from 'src/base/common/utilities/object';

/**
 * This is an empty suite. Act like a placeholder that you may write any testing 
 * code convinently during your development.
 */
suite('performance-test', () => {
    
    test('', () => {
        // const generateRandomTestArguments = () => {
        //     const arrayLength = Math.floor(Math.random() * 1000) + 5; // Array length between 5 and 15
        //     const array = Array.from({ length: arrayLength }, () => Math.floor(Math.random() * 100)); // Random integers
    
        //     const indices: number[] = [];
        //     const elements: number[][] = [];
        //     for (let i = 0; i < 3; i++) { // Generate 3 random indices and elements
        //         indices.push(Math.floor(Math.random() * arrayLength));
        //         elements.push([Math.floor(Math.random() * 100)]); // Elements are arrays with one random integer
        //     }
    
        //     return [array, indices, elements] as const;
        // };

        // PerfUtils.Sync.compareInIterations(
        //     'insertByIndex',
        //     () => Arrays.insertByIndex(...generateRandomTestArguments()),
        //     'insertByIndexOptimized',
        //     () => Arrays.insertByIndexOptimized(...generateRandomTestArguments()),
        //     5000,
        //     {
        //         toLog: true,
        //         timePrecision: 6,
        //     }
        // );
    });
});