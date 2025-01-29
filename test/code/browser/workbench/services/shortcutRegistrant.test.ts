import * as assert from 'assert';
import { Shortcut } from "src/base/common/keyboard";
import { IS_MAC } from 'src/base/common/platform';
import { ShortcutRegistrant, ShortcutWeight } from 'src/workbench/services/shortcut/shortcutRegistrant';

suite('ShortcutRegistrant', () => {
    
    let registrant: ShortcutRegistrant;

    setup(() => {
        registrant = new ShortcutRegistrant();
    });

    test('register a shortcut and verify registration', () => {
        const shortcut = Shortcut.fromString('Ctrl+A');
        const commandID = 'testCommand';
        const registration = {
            shortcut,
            commandArgs: [],
            when: null,
            weight: ShortcutWeight.Core
        };
        
        const disposable = registrant.register2(commandID, registration);
        
        assert.strictEqual(registrant.isRegistered(shortcut, commandID), true);
        
        disposable.dispose();
        assert.strictEqual(registrant.isRegistered(shortcut, commandID), false);
    });

    test('registerBasic with mac-specific shortcut', () => {
        if (!IS_MAC) {
            return;
        }
        const commandID = 'macCommand';
        const registration = { key: 'Cmd+Shift+M', mac: 'Cmd+Shift+N', commandArgs: [], when: null, weight: ShortcutWeight.BuiltInExtension };
        
        const disposable = registrant.registerBasic(commandID, registration);
        const shortcut = Shortcut.fromString('Cmd+Shift+N');
        
        assert.strictEqual(registrant.isRegistered(shortcut, commandID), true);
        disposable.dispose();
        assert.strictEqual(registrant.isRegistered(shortcut, commandID), false);
    });

    test('register multiple shortcuts with different commands', () => {
        const shortcut1 = Shortcut.fromString('Ctrl+X');
        const shortcut2 = Shortcut.fromString('Ctrl+Y');
        const commandID1 = 'command1';
        const commandID2 = 'command2';
        
        const disposable1 = registrant.register2(commandID1, { shortcut: shortcut1, commandArgs: [], when: null, weight: ShortcutWeight.Editor });
        const disposable2 = registrant.register2(commandID2, { shortcut: shortcut2, commandArgs: [], when: null, weight: ShortcutWeight.Editor });

        assert.strictEqual(registrant.isRegistered(shortcut1, commandID1), true);
        assert.strictEqual(registrant.isRegistered(shortcut2, commandID2), true);

        disposable1.dispose();
        disposable2.dispose();

        assert.strictEqual(registrant.isRegistered(shortcut1, commandID1), false);
        assert.strictEqual(registrant.isRegistered(shortcut2, commandID2), false);
    });

    test('attempt to register duplicate shortcut throws error', () => {
        const shortcut = Shortcut.fromString('Ctrl+Z');
        const commandID = 'duplicateCommand';
        
        registrant.register2(commandID, { shortcut, commandArgs: [], when: null, weight: ShortcutWeight.Core });

        assert.throws(() => {
            registrant.register2(commandID, { shortcut, commandArgs: [], when: null, weight: ShortcutWeight.Core });
        });
    });

    test('findShortcut retrieves registered shortcuts by hash', () => {
        const shortcut = Shortcut.fromString('Ctrl+Q');
        const commandID = 'findCommand';
        
        registrant.register2(commandID, { shortcut, commandArgs: [], when: null, weight: ShortcutWeight.Core });

        const result = registrant.findShortcut(shortcut);

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0]!.commandID, commandID);
    });

    test('findShortcut returns empty array for non-existent shortcut', () => {
        const shortcut = Shortcut.fromString('NonExistent+Shortcut');
        const result = registrant.findShortcut(shortcut);
        
        assert.strictEqual(result.length, 0);
    });

    test('getAllShortcutRegistrations returns all registered shortcuts', () => {
        const shortcut1 = Shortcut.fromString('Ctrl+E');
        const shortcut2 = Shortcut.fromString('Ctrl+R');
        const commandID1 = 'commandE';
        const commandID2 = 'commandR';
        
        registrant.register2(commandID1, { shortcut: shortcut1, commandArgs: [], when: null, weight: ShortcutWeight.Core });
        registrant.register2(commandID2, { shortcut: shortcut2, commandArgs: [], when: null, weight: ShortcutWeight.Core });

        const allRegistrations = registrant.getAllShortcutRegistrations();

        assert.strictEqual(allRegistrations.size, 2);
        assert.strictEqual(allRegistrations.get(shortcut1.toHashcode())?.[0]!.commandID, commandID1);
        assert.strictEqual(allRegistrations.get(shortcut2.toHashcode())?.[0]!.commandID, commandID2);
    });
});
