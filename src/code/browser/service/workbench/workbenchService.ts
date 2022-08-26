import { createService } from "src/code/platform/instantiation/common/decorator";

export const IWorkbenchService = createService<IWorkbenchService>('workbench-service');

export interface IWorkbenchService {

}