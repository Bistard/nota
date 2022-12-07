import { DisposableManager, IDisposable } from "src/base/common/dispose";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { ProseExtension } from "src/editor/common/proseMirror";
import { IEditorWidget } from "src/editor/editorWidget";

/**
 * An interface used to describe an extension for an editor that is created for
 * every time when an editor is created and disposed when the editor is disposed.
 */
export interface IEditorExtension extends IDisposable {
    // noop
}

export interface IEditorExtensionCtor {
    new (editor: IEditorWidget, service: IServiceProvider): IEditorExtension;
}

/**
 * @class The base class for every editor-related extension.
 */
export abstract class EditorExtension extends ProseExtension implements IEditorExtension {

    // [field]

    private readonly _disposables: DisposableManager;

    // [constructor]

    constructor() {
        super({});
        this._disposables = new DisposableManager();
    }

    // [public methods]

    public dispose(): void {
        this._disposables.dispose();
    }

    // [protected methods]

    protected __register<T extends IDisposable>(obj: T): T {
        if (obj && (obj as IDisposable) === this) {
			throw new Error('cannot register the disposable object to itself');
		}
        return this._disposables.register(obj);
    }
}