import * as assert from 'assert';
import { IStandardKeyboardEvent, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { ILogService } from 'src/base/common/logger';
import { IKeyboardService } from 'src/workbench/service/keyboard/keyboardService';
import { ShortcutWeight } from 'src/workbench/service/shortcut/shortcutRegistrant';
import { ShortcutService } from 'src/workbench/service/shortcut/shortcutService';
import { ICommandRegistrant } from 'src/platform/command/common/commandRegistrant';
import { CommandService, ICommandService } from 'src/platform/command/common/commandService';
import { CreateContextKeyExpr } from 'src/platform/context/common/contextKeyExpr';
import { ContextService, IContextService } from 'src/platform/context/common/contextService';
import { IEnvironmentService } from 'src/platform/environment/common/environment';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { IInstantiationService, InstantiationService } from 'src/platform/instantiation/common/instantiation';
import { ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { REGISTRANTS } from 'src/platform/registrant/common/registrant';
import { NullEnvironmentService, NullLifecycleService, NullLogger, TestKeyboardService } from 'test/utils/testService';

suite('shortcutService-test', () => {

    let keyboardService!: TestKeyboardService;
    let shortcutService!: ShortcutService;
    let contextService!: ContextService;

    setup(() => {
        const DI = new InstantiationService();

        keyboardService = new TestKeyboardService();
        const logService = new NullLogger();
        const fileService = new FileService(logService);
        contextService = new ContextService();
        const commandService = new CommandService(DI, logService);

        DI.register(IInstantiationService, DI);
        DI.register(IKeyboardService, keyboardService);
        DI.register(ILogService, logService);
        DI.register(IFileService, fileService);
        DI.register(IContextService, contextService);
        DI.register(ICommandService, commandService);
        DI.register(ILifecycleService, new NullLifecycleService());
        DI.register(IEnvironmentService, new NullEnvironmentService());

        shortcutService = DI.createInstance(ShortcutService);
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
            preventDefault: () => { },
            stopPropagation: () => { },
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