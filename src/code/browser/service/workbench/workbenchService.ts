import { IComponent } from "src/code/browser/service/component/component";
import { IMicroService, createService } from "src/code/platform/instantiation/common/decorator";

export const IWorkbenchService = createService<IWorkbenchService>('workbench-service');

export interface IWorkbenchService extends IComponent, IMicroService {

}