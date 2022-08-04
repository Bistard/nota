import * as assert from 'assert';
import { AsyncParallelExecutor, delayFor } from 'src/base/common/util/async';

suite('AsyncParallelExecutor', () => {

    test('basic - sync', async () => {
        let count = 0;
        const executor = new AsyncParallelExecutor<void>(2);
        const getNum = () => () => {
            count++;
            return Promise.resolve();
        };

        const promises = [executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum())];
        await Promise.all(promises);
        assert.strictEqual(count, 5);
    });

    test('basic - async', async () => {
        let count = 0;
        const executor = new AsyncParallelExecutor<void>(2);
        const getNum = () => async () => {
            return delayFor(0).then(() => { count++; });
        };

        const promises = [executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum())];
        await Promise.all(promises);
        assert.strictEqual(count, 5);
    });

    test('pause / resume', async () => {
        let count = 0;
        const executor = new AsyncParallelExecutor<void>(2);
        const getNum = () => async () => {
            return delayFor(0).then(() => { count++; });
        };

        executor.pause();
        const promises = [executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum()), executor.push(getNum())];
        delayFor(0, () => executor.resume());
        await Promise.all(promises);

        assert.strictEqual(count, 5);
    });

});