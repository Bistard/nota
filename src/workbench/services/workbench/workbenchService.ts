import { IComponent } from "src/workbench/services/component/component";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IContextKey } from "src/platform/context/common/contextKey";

export const IWorkbenchService = createService<IWorkbenchService>('workbench-service');

export interface IWorkbenchService extends IComponent, IService {

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