import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ISideView } from "src/code/browser/workbench/sideView/sideView";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IExplorerViewService = createService<IExplorerViewService>('explorer-view-service');

/**
 * An interface only for {@link ExplorerView}.
 */
export interface IExplorerViewService extends ISideView {
    
    /**
     * Determine if the explorer view is opened right now.
     */
    readonly isOpened: boolean;

    /**
     * The root directory of the current opened explorer view. `undefined` if 
     * the view is not opened yet.
     */
    readonly root: URI | undefined;

    /**
     * Fired when the directory is opened.
     */
    onDidOpen: Register<ClassicOpenEvent>;

    /**
     * Open the explorer view under the given root path.
     */
    open(root: URI): Promise<void>;

    /**
     * Close the explorer view if any path is opened.
     */
    close(): Promise<void>;
}

export interface ClassicOpenEvent {

    /**
     * The path of the directory in string form.
     */
    readonly path: URI;
}