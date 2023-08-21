import * as assert from 'assert';
import { FakeConsole } from 'test/utils/fakeConsole';

suite('FakeConsole-test', () => {
    
    suite('disable', () => {
        test('should restore original console.log after disabling', () => {
            const originalLog = console.log;
            FakeConsole.enable({ enable: true });
            FakeConsole.disable();
            assert.strictEqual(console.log, originalLog);
        });
    });

    suite('enable', () => {

        test('should not replace console.log when enable is false', () => {
            const originalLog = console.log;
            FakeConsole.enable({ enable: false });
            assert.strictEqual(console.log, originalLog);
            FakeConsole.disable();
        });

        test('should replace console.log when enable is true', () => {
            const originalLog = console.log;
            FakeConsole.enable({ enable: true });
            assert.notStrictEqual(console.log, originalLog);
            FakeConsole.disable();
        });

        test('should call onLog callback when logging', () => {
            let receivedMessage = '';
            const onLog = (message: string) => {
                receivedMessage = message;
            };
            FakeConsole.enable({ enable: true, onLog });
            console.log('test message');
            assert.strictEqual(receivedMessage, 'test message');
            FakeConsole.disable();
        });
    });
});
