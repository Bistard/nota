import * as assert from 'assert';
import { INSTANT_TIME } from 'src/base/common/date';
import { delayFor } from 'src/base/common/utilities/async';
import { AbstractLifecycleService } from 'src/platform/lifecycle/common/abstractLifecycleService';
import { NullLogger } from 'test/utils/testService';

suite('AbstractLifecycleService-test', () => {

    const enum TestPhase {
        start,
        Phase1,
        Phase2,
        Phase3,
    }

    class TestLifecycleService extends AbstractLifecycleService<TestPhase, 0> {
        constructor() {
            super('Test', TestPhase.start, () => '', new NullLogger());
        }

        public isQuit = false;
        public override async quit(): Promise<void> {
            this.isQuit = true;
        }
    }

    test('setPhase / when', async () => {

        const service = new TestLifecycleService();

        const currPhase: TestPhase[] = [];
        service.when(TestPhase.Phase1).then(() => currPhase.push(TestPhase.Phase1));

        service.setPhase(TestPhase.Phase1);
        await delayFor(INSTANT_TIME, () => assert.strictEqual(currPhase[0], TestPhase.Phase1));

        service.when(TestPhase.Phase2).then(() => currPhase.push(TestPhase.Phase2));
        service.when(TestPhase.Phase3).then(() => currPhase.push(TestPhase.Phase3));

        service.setPhase(TestPhase.Phase3);
        await delayFor(INSTANT_TIME, () => assert.strictEqual(currPhase[1], TestPhase.Phase3));
    });
});