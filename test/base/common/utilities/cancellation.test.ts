import * as assert from 'assert';
import { CancellationToken } from 'src/base/common/utilities/cancellation';

suite('cancellation-test', () => {
    
    test('CancellationToken', () => {
        const token = new CancellationToken();

        let cancelled = false;
        token.onDidCancel(() => {
            cancelled = true;
        });

        token.cancel();

        assert.ok(cancelled);
        assert.ok(token.isCancelled());
    });
});