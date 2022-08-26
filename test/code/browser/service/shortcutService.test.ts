import * as assert from 'assert';
import { Emitter, Register } from 'src/base/common/event';
import { IStandardKeyboardEvent, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { mockType } from 'src/base/common/util/type';
import { IKeyboardService } from 'src/code/browser/service/keyboard/keyboardService';
import { ShortcutService } from 'src/code/browser/service/shortcut/shortcutService';
import { FileService } from 'src/code/platform/files/common/fileService';
import { InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { NullEnvironmentService, NullLifecycleService, NullLogger } from 'test/testUtility';

class TestKeyboardService implements IKeyboardService {

    private emitter: Emitter<IStandardKeyboardEvent> = new Emitter();

    constructor() {
        
    }

    public fire(event: IStandardKeyboardEvent): void {
        this.emitter.fire(event);
    }

    get onKeydown(): Register<IStandardKeyboardEvent> {
        return this.emitter.registerListener;
    }
    
    get onKeyup(): Register<IStandardKeyboardEvent> {
        return this.emitter.registerListener;
    }

    dispose(): void {
        this.emitter.dispose();
    }

}

suite('shortcutService-test', () => {

    let keyboardService!: TestKeyboardService;
    let shortcutService!: ShortcutService; 

    setup(() => {
        keyboardService = new TestKeyboardService();
        const logService = new NullLogger();
        const fileService = new FileService(logService);
        const instantiaionService = new InstantiationService();
        shortcutService = new ShortcutService(keyboardService, new NullLifecycleService(), instantiaionService, mockType(new NullEnvironmentService()), fileService, logService);
    });

    test('register and unregister', () => {
        
        let pressed = 0;

        const windowFocusOnChange = new Emitter<boolean>();
        
        const shortcut = new Shortcut(true, false, false, false, KeyCode.Space);
        
        const unregister = shortcutService.register({
            shortcut: shortcut,
            when: windowFocusOnChange.registerListener,
            command: () => pressed++,
            activate: false,
            override: false,
            commandID: 'test.shortcut',
            whenID: 'N/A',
        });

        keyboardService.fire({
            ctrl: true,
            alt: false,
            shift: false,
            meta: false,
            key: KeyCode.Space,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        });

        assert.strictEqual(pressed, 0);

        windowFocusOnChange.fire(true);

        keyboardService.fire({
            ctrl: true,
            alt: false,
            shift: false,
            meta: false,
            key: KeyCode.Space,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        });

        assert.strictEqual(pressed, 1);

        windowFocusOnChange.fire(false);
        keyboardService.fire({
            ctrl: true,
            alt: false,
            shift: false,
            meta: false,
            key: KeyCode.Space,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        });

        assert.strictEqual(pressed, 1);

        windowFocusOnChange.fire(true);
        keyboardService.fire({
            ctrl: true,
            alt: false,
            shift: false,
            meta: false,
            key: KeyCode.Space,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        });

        assert.strictEqual(pressed, 2);

        unregister.dispose();
        keyboardService.fire({
            ctrl: true,
            alt: false,
            shift: false,
            meta: false,
            key: KeyCode.Space,
            browserEvent: null as unknown as KeyboardEvent,
            target: null as unknown as HTMLElement,
            preventDefault: () => {},
            stopPropagation: () => {},
        });

        assert.strictEqual(pressed, 2);
    });
});