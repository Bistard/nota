import * as assert from 'assert';
import { IStandardKeyboardEvent, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { mockType } from 'src/base/common/util/type';
import { ShortcutWeight } from 'src/code/browser/service/shortcut/shortcutRegistrant';
import { ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';
import { ICommandRegistrant } from 'src/code/platform/command/common/commandRegistrant';
import { CreateContextKeyExpr } from 'src/code/platform/context/common/contextKeyExpr';
import { ContextService } from 'src/code/platform/context/common/contextService';
import { FileService } from 'src/code/platform/files/common/fileService';
import { InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';
import { NullEnvironmentService, NullLifecycleService, NullLogger, TestKeyboardService } from 'test/utility';

suite('shortcutService-test', () => {

    let keyboardService!: TestKeyboardService;
    let shortcutService!: ShortcutService; 
    let contextService!: ContextService;

    setup(() => {
        keyboardService = new TestKeyboardService();
        const logService = new NullLogger();
        const fileService = new FileService(logService);
        const instantiaionService = new InstantiationService();
        contextService = new ContextService();
        shortcutService = new ShortcutService(keyboardService, new NullLifecycleService(), instantiaionService, mockType(new NullEnvironmentService()), fileService, logService, contextService);
    });

    function createKeyboardEvent(shortcut: Shortcut): IStandardKeyboardEvent {
        return {
            ctrl: shortcut.ctrl,
            alt: shortcut.alt,
            shift: shortcut.shift,
            meta: shortcut.meta,
            key: shortcut.key,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        };
    }

    test('register and unregister', () => {
        
        let pressed = 0;
        const commandRegistrant = REGISTRANTS.get(ICommandRegistrant);
        commandRegistrant.registerCommand({ id: 'test-shortcut' }, () => pressed++);

        const shortcut = new Shortcut(true, false, false, false, KeyCode.Space);
        const precondition = CreateContextKeyExpr.Equal('value', true);
        
        const unregister = shortcutService.register({
            shortcut: shortcut,
            when: precondition,
            commandID: 'test-shortcut',
            weight: ShortcutWeight.ExternalExtension,
        });

        contextService.setContext('value', false);
        keyboardService.fire(createKeyboardEvent(new Shortcut(true, false, false, false, KeyCode.Space)));
        assert.strictEqual(pressed, 0);

        contextService.setContext('value', true);
        keyboardService.fire(createKeyboardEvent(new Shortcut(true, false, false, false, KeyCode.Space)));
        assert.strictEqual(pressed, 1);

        contextService.setContext('value', false);
        keyboardService.fire(createKeyboardEvent(new Shortcut(true, false, false, false, KeyCode.Space)));
        assert.strictEqual(pressed, 1);

        contextService.setContext('value', true);
        keyboardService.fire(createKeyboardEvent(new Shortcut(true, false, false, false, KeyCode.Space)));
        assert.strictEqual(pressed, 2);

        unregister.dispose();
        keyboardService.fire(createKeyboardEvent(new Shortcut(true, false, false, false, KeyCode.Space)));
        assert.strictEqual(pressed, 2);
    });
});