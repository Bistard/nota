import { ITreeService } from "src/code/browser/service/explorerTree/explorerTreeService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const INotebookTreeService = createService<INotebookTreeService>('notebook-service');

export interface INotebookTreeService extends ITreeService {
    
}

/**
 * // TODO
 */
export class NotebookTreeService implements INotebookTreeService {

}