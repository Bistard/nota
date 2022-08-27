import { ITreeService } from "src/code/browser/service/explorerTree/explorerTreeService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IFolderTreeService = createService<IFolderTreeService>('folder-tree-serivce');

export interface IFolderTreeService extends ITreeService {

}

/**
 * // TODO
 */
export class FolderTreeService implements IFolderTreeService {

}