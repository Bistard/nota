import { IComponent } from "src/code/browser/service/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IWorkbenchService = createService<IWorkbenchService>('workbench-service');

export interface IWorkbenchService extends IComponent, IService {

}