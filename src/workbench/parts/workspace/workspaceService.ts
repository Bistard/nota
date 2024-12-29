import { createService, IService } from 'src/platform/instantiation/common/decorator';
import { IComponent } from 'src/workbench/services/component/component';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

/**
 * An interface only for {@link Workspace}.
 */
export interface IWorkspaceService extends IComponent, IService {

    /**
     * // TODO
     * @param model 
     */
    openEditor(model: EditorPaneModel): Promise<void>;
}