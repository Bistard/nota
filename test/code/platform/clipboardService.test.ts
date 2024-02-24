import * as assert from 'assert';
import { URI } from "src/base/common/files/uri";
import { ClipboardType } from "src/platform/clipboard/common/clipboard";
import { BrowserClipboardService } from 'src/platform/clipboard/browser/clipboardService';
import { SimpleLogger } from 'test/utils/testService';
import { afterEach, beforeEach } from 'mocha';
import { Mutable } from 'src/base/common/utilities/type';

suite('BrowserClipboardService-test', () => {
    
    const clipboardService = new BrowserClipboardService(new SimpleLogger());
    let _navigatorClipboard = '';

    // mock 'navigator' since it does not exist in node.js env
    beforeEach(() => {
        (<Mutable<any>>global.navigator.clipboard) = { 
            writeText: async (text: string) => { _navigatorClipboard = text; },
            readText: async () => _navigatorClipboard,
        };
    });

    afterEach(() => {
        (<Mutable<any>>global.navigator.clipboard) = undefined!;
        _navigatorClipboard = '';
    });

    test('write and read text', async () => {
        const text = 'Example text';
        await clipboardService.write(ClipboardType.Text, text);
        const result = await clipboardService.read(ClipboardType.Text);
        assert.strictEqual(result, text);
    });

    test('write and read resources', async () => {
        const resources = [URI.parse('path/to/resource1'), URI.parse('path/to/resource2')];
        await clipboardService.write(ClipboardType.Resources, resources);
        const result = await clipboardService.read(ClipboardType.Resources);
        assert.deepStrictEqual(result, resources);
    });

    test('read text with empty clipboard', async () => {
        const result = await clipboardService.read(ClipboardType.Text);
        assert.strictEqual(result, '');
    });

    test('read resources with empty clipboard', async () => {
        const result = await clipboardService.read(ClipboardType.Resources);
        assert.deepStrictEqual(result, []);
    });

    test('clean resources after read', async () => {
        const resources = [URI.parse('path/to/resource')];
        await clipboardService.write(ClipboardType.Resources, resources);
        await clipboardService.read(ClipboardType.Resources);
        const result = await clipboardService.read(ClipboardType.Resources);
        assert.deepStrictEqual(result, []);
    });
});
