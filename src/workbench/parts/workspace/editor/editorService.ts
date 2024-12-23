import { URI } from "src/base/common/files/uri";
import { IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IEditorWidget } from "src/editor/editorWidget";
import { Register } from "src/base/common/event";

export const IEditorService = createService<IEditorService>('editor-service');

export interface IEditorService extends IComponent, IService {

    /**
     * The actual editor widget.
     */
    readonly editor: IEditorWidget | null;

    /**
     * Fires when the editor opens a file.
     */
    readonly onDidOpen: Register<URI>;

    /**
     * @description Opening a source given the URI in the editor.
     * @param source The {@link URI} or an RUI in the string form.
     */
    openSource(source: URI | string): Promise<void>;
}