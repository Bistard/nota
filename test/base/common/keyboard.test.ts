import * as assert from 'assert';
import { Keyboard, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { IS_MAC, PLATFORM } from 'src/base/common/platform';

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

        test('shortcut fromString/equal', () => {
            assert.strictEqual(Shortcut.fromString('Ctrl+Tab').equal(new Shortcut(true, false, false, false, KeyCode.Tab)), true);
            assert.strictEqual(Shortcut.fromString('Ctrl').equal(new Shortcut(true, false, false, false, KeyCode.None)), true);
            assert.strictEqual(Shortcut.fromString('Ctrl+Shift+Alt+Meta+R').equal(new Shortcut(true, true, true, true, KeyCode.KeyR)), true);
            assert.strictEqual(Shortcut.fromString('Shift+Ctrl+Meta+Alt+R').equal(new Shortcut(true, true, true, true, KeyCode.KeyR)), true);
            assert.strictEqual(Shortcut.fromString('PageDown').equal(new Shortcut(false, false, false, false, KeyCode.PageDown)), true);
            assert.strictEqual(Shortcut.fromString('Ctrl+PageDown').equal(new Shortcut(true, false, false, false, KeyCode.PageDown)), true);
            assert.strictEqual(Shortcut.fromString('Shift+Alt+0').equal(new Shortcut(false, true, true, false, KeyCode.Digit0)), true);

            assert.strictEqual(Shortcut.fromString('Shift+Tab+0').equal(Shortcut.None), true);
            assert.strictEqual(Shortcut.fromString('abc').equal(Shortcut.None), true);
            assert.strictEqual(Shortcut.fromString('Ctrl+abc').equal(Shortcut.None), true);
            assert.strictEqual(Shortcut.fromString('ctrl').equal(Shortcut.None), true);
            assert.strictEqual(Shortcut.fromString('00').equal(Shortcut.None), true);
        });

        const enum KeyModifer {
            CtrlCmd = (1 << 11) >>> 0,
            Shift = (1 << 10) >>> 0,
            Alt = (1 << 9) >>> 0,
            WinCtrl = (1 << 8) >>> 0,
        }

        function testHash(shortcut: Shortcut, expected: number, isMac: boolean): void {
            
            const hashcode = shortcut.toHashcode();
            const converted = Shortcut.fromHashcode(hashcode, PLATFORM);

            const expectCtrlCmd = expected & KeyModifer.CtrlCmd;
            const expectShift = expected & KeyModifer.Shift;
            const expectAlt = expected & KeyModifer.Alt;
            const expectWinCtrl = expected & KeyModifer.WinCtrl;

            assert.strictEqual(converted.shift, Boolean(expectShift));
            assert.strictEqual(converted.alt, Boolean(expectAlt));

            if (isMac) {
                assert.strictEqual(converted.ctrl, Boolean(expectWinCtrl));
                assert.strictEqual(converted.meta, Boolean(expectCtrlCmd));
            } else {
                assert.strictEqual(converted.ctrl, Boolean(expectCtrlCmd));
                assert.strictEqual(converted.meta, Boolean(expectWinCtrl));
            }

        }

        test('MAC - shortcut encoding & decoding', function () {
            if (!IS_MAC) {
                this.skip();
            }
            
            testHash(new Shortcut(false, false, false, false, KeyCode.Enter), KeyCode.Enter, true);
			testHash(new Shortcut(false, false, false, true, KeyCode.Enter), KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(false, false, true, false, KeyCode.Enter), KeyModifer.Alt | KeyCode.Enter, true);
			testHash(new Shortcut(false, false, true, true, KeyCode.Enter), KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(false, true, false, false, KeyCode.Enter), KeyModifer.Shift | KeyCode.Enter, true);
			testHash(new Shortcut(false, true, false, true, KeyCode.Enter), KeyModifer.Shift | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(false, true, true, false, KeyCode.Enter), KeyModifer.Shift | KeyModifer.Alt | KeyCode.Enter, true);
			testHash(new Shortcut(false, true, true, true, KeyCode.Enter), KeyModifer.Shift | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(true, false, false, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyCode.Enter, true);
			testHash(new Shortcut(true, false, false, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(true, false, true, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Alt | KeyCode.Enter, true);
			testHash(new Shortcut(true, false, true, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(true, true, false, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyCode.Enter, true);
			testHash(new Shortcut(true, true, false, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.WinCtrl | KeyCode.Enter, true);
			testHash(new Shortcut(true, true, true, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.Alt | KeyCode.Enter, true);
			testHash(new Shortcut(true, true, true, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, true);
        });

        test('WINDOWS & LINUX - shortcut encoding & decoding', function () {
            if (IS_MAC) {
                this.skip();
            }

            testHash(new Shortcut(false, false, false, false, KeyCode.Enter), KeyCode.Enter, false);
			testHash(new Shortcut(false, false, false, true, KeyCode.Enter), KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(false, false, true, false, KeyCode.Enter), KeyModifer.Alt | KeyCode.Enter, false);
			testHash(new Shortcut(false, false, true, true, KeyCode.Enter), KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(false, true, false, false, KeyCode.Enter), KeyModifer.Shift | KeyCode.Enter, false);
			testHash(new Shortcut(false, true, false, true, KeyCode.Enter), KeyModifer.Shift | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(false, true, true, false, KeyCode.Enter), KeyModifer.Shift | KeyModifer.Alt | KeyCode.Enter, false);
			testHash(new Shortcut(false, true, true, true, KeyCode.Enter), KeyModifer.Shift | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(true, false, false, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyCode.Enter, false);
			testHash(new Shortcut(true, false, false, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(true, false, true, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Alt | KeyCode.Enter, false);
			testHash(new Shortcut(true, false, true, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(true, true, false, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyCode.Enter, false);
			testHash(new Shortcut(true, true, false, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.WinCtrl | KeyCode.Enter, false);
			testHash(new Shortcut(true, true, true, false, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.Alt | KeyCode.Enter, false);
			testHash(new Shortcut(true, true, true, true, KeyCode.Enter), KeyModifer.CtrlCmd | KeyModifer.Shift | KeyModifer.Alt | KeyModifer.WinCtrl | KeyCode.Enter, false);
        });
    });

});