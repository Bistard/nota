import * as assert from 'assert';
import { before } from 'mocha';
import { IStandardKeyboardEvent, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { ILogService } from 'src/base/common/logger';
import { IKeyboardService } from 'src/workbench/services/keyboard/keyboardService';
import { ShortcutRegistrant, ShortcutWeight } from 'src/workbench/services/shortcut/shortcutRegistrant';
import { ShortcutService } from 'src/workbench/services/shortcut/shortcutService';
import { CommandRegistrant } from 'src/platform/command/common/commandRegistrant';
import { CommandService, ICommandService } from 'src/platform/command/common/commandService';
import { CreateContextKeyExpr } from 'src/platform/context/common/contextKeyExpr';
import { ContextService, IContextService } from 'src/platform/context/common/contextService';
import { IEnvironmentService } from 'src/platform/environment/common/environment';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { IInstantiationService, InstantiationService } from 'src/platform/instantiation/common/instantiation';
import { ILifecycleService } from 'src/platform/lifecycle/browser/browserLifecycleService';
import { NullEnvironmentService, NullLifecycleService, NullLogger, TestKeyboardService } from 'test/utils/testService';
import { IRegistrantService, RegistrantService } from 'src/platform/registrant/common/registrantService';

suite('shortcutService-test', () => {

    let keyboardService: TestKeyboardService;
    let shortcutService: ShortcutService;
    let contextService: ContextService;
    let commandRegistrant: CommandRegistrant;
    let shortcutRegistrant: ShortcutRegistrant;

    before(() => {
        const DI = new InstantiationService();

        keyboardService = new TestKeyboardService();
        const logService = new NullLogger();
        const fileService = new FileService(logService);
        contextService = new ContextService();
        
        const registrantService = new RegistrantService(new NullLogger());

        shortcutRegistrant = new ShortcutRegistrant();
        registrantService.registerRegistrant(shortcutRegistrant);

        commandRegistrant = new CommandRegistrant(new NullLogger(), registrantService);
        registrantService.registerRegistrant(commandRegistrant);

        DI.store(IRegistrantService, registrantService);

        const commandService = new CommandService(DI, logService, registrantService);

        DI.store(IInstantiationService, DI);
        DI.store(IKeyboardService, keyboardService);
        DI.store(ILogService, logService);
        DI.store(IFileService, fileService);
        DI.store(IContextService, contextService);
        DI.store(ICommandService, commandService);
        DI.store(ILifecycleService, new NullLifecycleService());
        DI.store(IEnvironmentService, new NullEnvironmentService());

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
        
        commandRegistrant.registerCommandBasic({ id: 'test-shortcut', command: () => pressed++ });

        const shortcut = new Shortcut(true, false, false, false, KeyCode.Space);
        const precondition = CreateContextKeyExpr.Equal('value', true);

        const unregister = shortcutRegistrant.register(
            'test-shortcut', {
            shortcut: shortcut,
            when: precondition,
            weight: ShortcutWeight.ExternalExtension,
            commandArgs: [],
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