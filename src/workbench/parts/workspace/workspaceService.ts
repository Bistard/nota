import { createService, IService } from 'src/platform/instantiation/common/decorator';
import { IComponent } from 'src/workbench/services/component/component';


export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');
/**
 * An interface only for {@link WorkspaceView}.
 */

export interface IWorkspaceService extends IComponent, IService {
}
