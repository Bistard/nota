import * as assert from 'assert';
import * as os from 'os';
import { IS_LINUX, IS_MAC, IS_WINDOWS, PLATFORM, Platform } from 'src/base/common/platform';

declare const navigator: any;

suite('platform-test', () => {

    const OS = {
        isWin: os.platform() === 'win32',
        isMac: os.platform() === 'darwin',
        isLinux: os.platform() === 'linux',
    };

    test('Is Windows check', () => {
        assert.strictEqual(IS_WINDOWS, OS.isWin);
        if (!IS_WINDOWS) {
            return;
        }
        assert.strictEqual(PLATFORM, Platform.Windows);
    });

    test('Is Mac check', () => {
        assert.strictEqual(IS_MAC, OS.isMac);
        if (!IS_MAC) {
            return;
        }
        assert.strictEqual(PLATFORM, Platform.Mac);
    });

    test('Is Linux check', () => {
        assert.strictEqual(IS_LINUX, OS.isLinux);
        if (!IS_LINUX) {
            return;
        }
        assert.strictEqual(PLATFORM, Platform.Linux);
    });
});