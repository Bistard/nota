import { ContextMenu, IContextMenu, IContextMenuDelegate } from "src/base/browser/basic/contextMenu/contextMenu";
import { DomUtility } from "src/base/browser/basic/dom";
import { IAction } from "src/base/common/action";
import { Disposable } from "src/base/common/dispose";
import { IWorkbenchService } from "src/code/browser/service/workbench/workbenchService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IContextMenuService = createService<IContextMenuService>('context-menu-service');

/**
 * // TODO
 */
export interface IContextMenuServiceDelegate extends IContextMenuDelegate {
    
    /**
     * @description
     */
    getActions(): IAction[];
}

/**
 * An interface only for {@link ContextMenuService}.
 */
export interface IContextMenuService {
    showContextMenu(delegate: IContextMenuDelegate): void;
}

/**
 * @class // TODO
 */
export class ContextMenuService extends Disposable implements IContextMenuService {

    // [fields]

    // singleton
    private readonly _contextMenu: IContextMenu;
    
    // The current container of the context menu.
    private _currContextMenuContainer?: HTMLElement;
    private readonly _defaultContainer: HTMLElement;


    // [constructor]

    constructor(
        @IWorkbenchService private readonly workbenchService: IWorkbenchService,
    ) {
        super();
        this._defaultContainer = this.workbenchService.element.element;
        this._currContextMenuContainer = this._defaultContainer;
        this._contextMenu = new ContextMenu(this._currContextMenuContainer);
    }

    // [public methods]

    public showContextMenu(delegate: IContextMenuServiceDelegate, container?: HTMLElement): void {
        
        // since the delegate provies no actions, we render nothing.
        if (delegate.getActions().length === 0) {
            return;
        }

        const focusElement = <HTMLElement | undefined>(
            container ?? DomUtility.Elements.getActiveElement()
        );

        if (!focusElement) {
            this._contextMenu.setContainer(this._defaultContainer);
        } else {
            this._contextMenu.setContainer(focusElement);
        }

        this._contextMenu.show(delegate); // TODO: predefined delegate behaviour
    }

    // [private methods]

}
