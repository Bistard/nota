import { Register } from "src/base/common/event";
import { IEditorWidget } from "src/editor/editorWidget";
import { createService, IService, refineDecorator } from "src/platform/instantiation/common/decorator";

export const IEditorService = createService<IEditorService>('editor-service');

/** Do not use this unless you know what you are doing. */
export const IEditorHostService = refineDecorator<IEditorService, IEditorHostService>(IEditorService);

/**
 * A service that tracks the lifecycle and status of {@link IEditorWidget} 
 * instances.
 * @note It does NOT manage the actual lifecycle of editors, but rather observes 
 *       and emits events related to their creation, focus state, and closure.
 */
export interface IEditorService extends IService {
    
    readonly onCreateEditor: Register<void>;
    readonly onDidCreateEditor: Register<IEditorWidget>;
    readonly onCloseEditor: Register<IEditorWidget>;
    readonly onDidCloseEditor: Register<void>;
    
    /**
     * Fires the current focused editor.
     */
    readonly onDidFocusedEditorChange: Register<IEditorWidget | undefined>;

    /**
     * The only editor that the user is currently typing with.
     */
    getFocusedEditor(): IEditorWidget | undefined;

    getEditors(): readonly IEditorWidget[];
}

export interface IEditorHostService extends IEditorService {
    onCreate(): void;
    create(editor: IEditorWidget): void;
    onClose(editor: IEditorWidget): void;
    close(): void;
    focus(editor: IEditorWidget): void;
    blur(editor: IEditorWidget): void;
}