import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { PauseableEmitter, Register } from "src/base/common/event";
import { hash } from "src/base/common/hash";
import { Shortcut } from "src/base/common/keyboard";
import { IKeyboardService } from "src/code/browser/service/keyboardService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IShortcutService = createDecorator<IShortcutService>('shortcut-service');

export interface IShortcutService {
    
    /**
     * All the registered shortcuts will be removed.
     */
    dispose(): void;
    
    /**
     * @description Register a {@link Shortcut} with a callback.
     * @param shortcut The shortcut to be registered.
     * @param when The callback to tell when the shortcut should be turned on.
     * @param callback The callback when the shortcut is pressed.
     * @returns A disposable to unregister the callback itself.
     */
    register(shortcut: Shortcut, when: Register<boolean>, callback: () => any): IDisposable;
    
    /**
     * @description Unregister the given {@link Shortcut} with all its listeners.
     * @param shortcut The shortcut to be unregistered.
     * @param force When `force` is true, the emittered will be deleted from the 
     * memory. When `force` is false, the shortcut emitter will still be cached 
     * in the memory for efficiency purposes.
     */
    unRegister(shortcut: Shortcut, force?: boolean): void;

}

export class ShortcutService implements IDisposable, IShortcutService {

    private disposables = new DisposableManager();

    private emitters: Map<number, PauseableEmitter<void>>;

    constructor(
        @IKeyboardService keyboardService: IKeyboardService,
    ) {
        this.emitters = new Map();

        keyboardService.onKeydown(e => {
            if (this.emitters.size === 0) {
                return;
            }

            const shortcut = new Shortcut(e.ctrl, e.shift, e.alt, e.meta, e.key);

            const val = hash(shortcut.toString());
            const emitter = this.emitters.get(val);
            if (emitter !== undefined) {
                emitter.fire();
            }
        });

    }

    public dispose(): void {
        this.emitters.forEach(emitter => emitter.dispose());
        this.emitters.clear();
        this.disposables.dispose();
    }

    public register(shortcut: Shortcut, when: Register<boolean>, callback: () => any): IDisposable {

        // hash the shortcut into a number for fast future map searching.
        const val = hash(shortcut.toString());
        let emitter = this.emitters.get(val);
        
        // if the shortcut is never registered, we create one.
        if (emitter === undefined) {
            emitter = new PauseableEmitter<void>();
            this.emitters.set(val, emitter);
            
            // toggles the emitter's functionality.
            this.disposables.register(
                when((on: boolean) => {
                    if (on) {
                        emitter!.resume();
                    } else {
                        emitter!.pause();
                    }
                })
            );
        }

        return emitter.registerListener(callback);
    }

    public unRegister(shortcut: Shortcut, force?: boolean): void {
        const val = hash(shortcut.toString());
        const emitter = this.emitters.get(val);
        if (emitter) {
            emitter.dispose();
            
            if (force) {
                this.emitters.delete(val);
            }
        }
    }
}