import * as assert from 'assert';
import { FocusTracker } from 'src/base/browser/basic/focusTracker';
import { delayFor } from 'src/base/common/util/async';

suite('FocusTracker-test', () => {

    test('onDidFocus / onDidBlur', async () => {
        const dom = document.createElement('div');
        document.body.appendChild(dom);

        const tracker = new FocusTracker(dom, true);
        let isFocused = false;

        tracker.onDidBlur(() => isFocused = false);
        tracker.onDidFocus(() => isFocused = true);

        dom.focus();
        assert.strictEqual(isFocused, true);

        dom.blur();
        
        await delayFor(0);
        assert.strictEqual(isFocused, false);
    });

    test('onDidFocusChange', async () => {
        const dom = document.createElement('div');
        document.body.appendChild(dom);

        const tracker = new FocusTracker(dom, true);
        let isFocused = false;

        tracker.onDidFocusChange((e) => isFocused = e);

        dom.focus();
        assert.strictEqual(isFocused, true);

        dom.blur();
        
        await delayFor(0);
        assert.strictEqual(isFocused, false);
    });
});