import * as assert from 'assert';
import { Random } from 'src/base/common/util/random';


suite('random-test', () => {

    test('shuffle', () => {
        const storeArray = [[0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0]];
        const testArray = [1, 2, 3, 4, 5];
        const shuffleTimes = 10000;
        
        for (let i = 0; i < shuffleTimes; i++) {
            Random.shuffle(testArray);
            for (let j = 0; j < testArray.length; j++) {
                const testArrayValue = testArray[j]! - 1;
                storeArray[testArrayValue]![j]! += 1;
            }
        }

        const expectedProbability = 1 / testArray.length;
        const offset = 0.03;
        const upperBound = expectedProbability + offset;
        const lowerBound = expectedProbability - offset;
        for (let i = 0; i < storeArray.length; i++) {
            let probability = 0;
            for (let j = 0; j < storeArray[i]!.length; j++) {
                probability = storeArray[i]![j]! / shuffleTimes;
                if (probability < lowerBound || probability > upperBound) {
                    assert.fail();
                }
            }
        }
    })
})