import * as assert from 'assert';
import { Shortcut } from "src/base/common/keyboard";
import { ShortcutRegistrant, ShortcutWeight } from 'src/workbench/services/shortcut/shortcutRegistrant';

suite('ShortcutRegistrant', () => {
    
    let registrant: ShortcutRegistrant;

    setup(() => {
        registrant = new ShortcutRegistrant();
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
