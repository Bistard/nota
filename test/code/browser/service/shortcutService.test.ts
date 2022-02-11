import * as assert from 'assert';
import { Emitter, Register } from 'src/base/common/event';
import { IStandardKeyboardEvent, KeyCode, Shortcut } from 'src/base/common/keyboard';
import { IKeyboardService } from 'src/code/browser/service/keyboardService';
import { ShortcutService } from 'src/code/browser/service/shortcutService';

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

    test('register and unregister', () => {
        
        let pressed = 0;

        const windowFocusOnChange = new Emitter<boolean>();
        
        const keyboardService = new TestKeyboardService();
        const shortcutService = new ShortcutService(keyboardService);
        
        const shortcut = new Shortcut(true, false, false, false, KeyCode.Space);
        
        shortcutService.register(shortcut, windowFocusOnChange.registerListener, () => pressed++);
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

        shortcutService.unRegister(shortcut);
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