import * as assert from 'assert';
import { ErrorHandler } from 'src/base/common/error';

suite('error-test', () => {
    
    test('setUnexpectedErrorExternalCallback', () => {
        let hit = false;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(err => { hit = true; });
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, true);
    });

    test('registerListener', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => {});

        const listener1 = ErrorHandler.registerListener(() => hit++);
        const listener2 = ErrorHandler.registerListener(() => hit++);

        ErrorHandler.onUnexpectedError(undefined);
        listener1.dispose();
        ErrorHandler.onUnexpectedError(undefined);
        listener2.dispose();
        ErrorHandler.onUnexpectedError(undefined);

        assert.strictEqual(hit, 3);
    });

    test('onUnexpectedExternalError', () => {
        let hit = 0;
        
        ErrorHandler.setUnexpectedErrorExternalCallback(() => hit--);

        const listener = ErrorHandler.registerListener(() => hit++);
        ErrorHandler.onUnexpectedExternalError(undefined);
        
        assert.strictEqual(hit, -1);
    });
});