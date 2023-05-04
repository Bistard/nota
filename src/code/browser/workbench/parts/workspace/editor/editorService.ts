import { URI } from "src/base/common/file/uri";
import { IComponent } from "src/code/browser/service/component/component";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IEditorWidget } from "src/editor/editorWidget";

export const IEditorService = createService<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

    /**
     * The actual editor widget.
     */
    readonly editor: IEditorWidget | null;

    /**
     * @description Openning a source given the URI in the editor.
     * @param source The {@link URI} or an RUI in the string form.
     */
    openSource(source: URI | string): void;
}