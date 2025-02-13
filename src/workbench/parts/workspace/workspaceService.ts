import { Register } from 'src/base/common/event';
import { URI } from 'src/base/common/files/uri';
import { createService, IService } from 'src/platform/instantiation/common/decorator';
import { IEditorGroupOpenOptions } from 'src/workbench/parts/workspace/editorGroupModel';
import { IComponent } from 'src/workbench/services/component/component';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

export interface IUnknownModel {
    readonly uri: URI;
}

/**
 * An interface only for {@link Workspace}.
 */
export interface IWorkspaceService extends IComponent, IService {

    /**
     * Fires whenever an editor is opened. `null` fired when no editors is 
     * opened right now.
     */
    readonly onDidOpen: Register<EditorPaneModel | null>;

    getCurrentEditor(): URI | null;

    /**
     * // TODO
     * @param model 
     */
    openEditor(unknown: IUnknownModel, options: IEditorGroupOpenOptions): Promise<void>;
    
    /**
     * // TODO
     * @param model 
     */
    openEditor(model: EditorPaneModel, options: IEditorGroupOpenOptions): Promise<void>;
}