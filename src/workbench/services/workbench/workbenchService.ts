import { IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IContextKey } from "src/platform/context/common/contextKey";
import { CollapseState } from "src/base/browser/basic/dom";
import { Register } from "src/base/common/event";

export const IWorkbenchService = createService<IWorkbenchService>('workbench-service');

/**
 * An interface only for {@link Workbench}.
 */
export interface IWorkbenchService extends IComponent, IService {

    /**
     * If the current workbench collapsed (if the navigation-panel is collapsed).
     */
    readonly collapseState: CollapseState;

    /**
     * Determines if the collapse/expand animation is in process.
     */
    readonly isCollapseAnimating: boolean;

    /**
     * Fires when the navigation-panel is collapsed or expanded.
     */
    readonly onDidCollapseStateChange: Register<CollapseState>;

    /**
     * @description Expose the contextKey out so that the client is able to 
     * update it.
     * @param name The name of the contextKey.
     * @returns The finding contextKey.
     */
    getContextKey<T>(name: string): IContextKey<T> | undefined;

    /**
     * @description Try to update the context to a contextKey (identified by 
     * 'name') with the 'value'.
     * @param name The name of the contextKey.
     * @param value The new value for the context.
     * @returns A boolean indicates if the update succeeded.
     * 
     * @note MAKE SURE your 'value' has the correct type. Otherwise things could
     * go strange!
     * @note Invoke this only if you know what you are modifying.
     */
    updateContext(name: string, value: any): boolean;
}