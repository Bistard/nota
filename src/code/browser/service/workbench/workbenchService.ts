import { Register } from "src/base/common/event";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IWorkbenchService = createDecorator<IWorkbenchService>('workbench-layout-service');

export interface IWorkbenchService {

    /**
     * Fires when the essential UI components are finished rendering.
     */
    onDidFinishLayout: Register<void>;

}