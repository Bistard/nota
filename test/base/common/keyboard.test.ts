import * as assert from 'assert';
import { Keyboard, KeyCode, Shortcut } from 'src/base/common/keyboard';

suite('keyboard-test', () => {

    test('isModifier', () => {
        assert.strictEqual(Keyboard.isModifier(KeyCode.Ctrl), true);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Shift), true);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Alt), true);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Meta), true);
        assert.strictEqual(Keyboard.isModifier(KeyCode.KeyA), false);
        assert.strictEqual(Keyboard.isModifier(KeyCode.PageDown), false);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Backquote), false);
        assert.strictEqual(Keyboard.isModifier(KeyCode.None), false);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Digit0), false);
        assert.strictEqual(Keyboard.isModifier(KeyCode.Space), false);
    });

    test('KeyCode toString', () => {
        assert.strictEqual(Keyboard.toString(KeyCode.Ctrl), 'Ctrl');
        assert.strictEqual(Keyboard.toString(KeyCode.Shift), 'Shift');
        assert.strictEqual(Keyboard.toString(KeyCode.Alt), 'Alt');
        assert.strictEqual(Keyboard.toString(KeyCode.Meta), 'Meta');
        assert.strictEqual(Keyboard.toString(KeyCode.KeyA), 'A');
        assert.strictEqual(Keyboard.toString(KeyCode.PageDown), 'PageDown');
        assert.strictEqual(Keyboard.toString(KeyCode.Backquote), '`');
        assert.strictEqual(Keyboard.toString(KeyCode.None), 'None');
        assert.strictEqual(Keyboard.toString(KeyCode.Digit0), '0');
        assert.strictEqual(Keyboard.toString(KeyCode.Space), 'Space');
    });

    test('KeyCode toKeyCode', () => {
        assert.strictEqual(Keyboard.toKeyCode('Ctrl'), KeyCode.Ctrl);
        assert.strictEqual(Keyboard.toKeyCode('Shift'), KeyCode.Shift);
        assert.strictEqual(Keyboard.toKeyCode('Alt'), KeyCode.Alt);
        assert.strictEqual(Keyboard.toKeyCode('Meta'), KeyCode.Meta);
        assert.strictEqual(Keyboard.toKeyCode('A'), KeyCode.KeyA);
        assert.strictEqual(Keyboard.toKeyCode('PageDown'), KeyCode.PageDown);
        assert.strictEqual(Keyboard.toKeyCode('`'), KeyCode.Backquote);
        assert.strictEqual(Keyboard.toKeyCode('None'), KeyCode.None);
        assert.strictEqual(Keyboard.toKeyCode('0'), KeyCode.Digit0);
        assert.strictEqual(Keyboard.toKeyCode('Space'), KeyCode.Space);
    });

    suite('shortcut-Test', () => {

        test('shortcut equality', () => {
            const shortcut1 = new Shortcut(false, false, false, false, KeyCode.KeyR);
            const shortcut2 = new Shortcut(true, false, false, false, KeyCode.KeyR);
            assert.strictEqual(shortcut1.equal(shortcut2), false);
            assert.strictEqual(shortcut1.equal(shortcut1), true);

            const shortcut3 = new Shortcut(false, false, false, false, KeyCode.Ctrl);
            const shortcut4 = new Shortcut(true, false, false, false, KeyCode.None);
            assert.strictEqual(shortcut3.equal(shortcut4), false);
        });

        test('shortcut toString', () => {
            const shortcut1 = new Shortcut(false, false, false, false, KeyCode.KeyR);
            const shortcut2 = new Shortcut(true, false, false, false, KeyCode.KeyR);
            assert.strictEqual(shortcut1.toString(), 'R');
            assert.strictEqual(shortcut2.toString(), 'Ctrl+R');

            const shortcut3 = new Shortcut(false, false, false, false, KeyCode.Ctrl);
            const shortcut4 = new Shortcut(true, false, false, false, KeyCode.None);
            assert.strictEqual(shortcut3.toString(), 'Ctrl');
            assert.strictEqual(shortcut4.toString(), 'Ctrl');

            const shortcut5 = new Shortcut(true, true, false, false, KeyCode.PageDown);
            assert.strictEqual(shortcut5.toString(), 'Ctrl+Shift+PageDown');

            const shortcut6 = new Shortcut(true, true, false, false, KeyCode.None);
            assert.strictEqual(shortcut6.toString(), 'Ctrl+Shift');

            const shortcut7 = new Shortcut(false, true, false, true, KeyCode.Enter);
            assert.strictEqual(shortcut7.toString(), 'Shift+Meta+Enter');
        });

    });

});