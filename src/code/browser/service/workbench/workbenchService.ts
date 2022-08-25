import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IWorkbenchService = createDecorator<IWorkbenchService>('workbench-service');

export interface IWorkbenchService {

}