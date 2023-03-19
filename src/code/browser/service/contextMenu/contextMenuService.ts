import { ContextMenu, IContextMenu, IContextMenuDelegate, IContextMenuDelegateBase } from "src/base/browser/basic/contextMenu/contextMenu";
import { addDisposableListener, DomEmitter, DomEventHandler, DomUtility, EventType } from "src/base/browser/basic/dom";
import { IMenu, Menu } from "src/base/browser/basic/menu/menu";
import { IMenuAction } from "src/base/browser/basic/menu/menuItem";
import { Disposable, DisposableManager } from "src/base/common/dispose";
import { ILayoutService } from "src/code/browser/service/layout/layoutService";
import { createService } from "src/code/platform/instantiation/common/decorator";

export const IContextMenuService = createService<IContextMenuService>('context-menu-service');

/**
 * Enable this setting to prevent any external actions from closing the context 
 * menu.
 */
const DEBUG_MODE: boolean = true;

/**
 * A delegate to provide external data dn functionalities to help to show a 
 * context menu.
 */
export interface IContextMenuServiceDelegate extends IContextMenuDelegateBase {
    
    /**
     * @description A list of actions for each context menu item.
     */
    getActions(): IMenuAction[];

    /**
     * @description Returns the running context for all the actions.
     */
    getContext(): unknown;

    /**
     * @description Allow the client to customize the style of the context menu.
     */
    getContextMenuClassName?(): string;
}

/**
 * An interface only for {@link ContextMenuService}.
 */
export interface IContextMenuService {
    
    /**
     * @description Shows up a context menu.
     * @param delegate The delegate to provide external functionalities.
     * @param container The container that contains the context menu. If not
     *                  provided, it will be positioned under the workbench.
     */
    showContextMenu(delegate: IContextMenuServiceDelegate, container?: HTMLElement): void;

    /**
     * @description Destroy the current context menu if existed.
     */
    destroyContextMenu(): void;
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
        @ILayoutService private readonly layoutService: ILayoutService,
    ) {
        super();
        this._defaultContainer = this.layoutService.parentContainer;
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

        // have to render first (add into a container)
        if (!focusElement) {
            this._contextMenu.setContainer(this._defaultContainer);
        } else {
            this._contextMenu.setContainer(focusElement);
        }

        // show up a context menu
        this._contextMenu.show(this.__createShowContextMenuDelegate(delegate));
    }

    public destroyContextMenu(): void {
        this._contextMenu.destroy();
    }

    // [private methods]

    private __createShowContextMenuDelegate(delegate: IContextMenuServiceDelegate): IContextMenuDelegate {
        let menu: IMenu | undefined;

        return {
            getAnchor: () => delegate.getAnchor(),
            
            render: (container: HTMLElement) => {
                const menuDisposables = new DisposableManager();

                const menuClassName = delegate.getContextMenuClassName?.() ?? '';
                if (menuClassName) {
                    container.classList.add(menuClassName);
                }

                // menu construction
                menu = menuDisposables.register(
                    new Menu(container, {
                        context: delegate.getContext(),
                        actions: delegate.getActions(),
                    })
                );

                if (DEBUG_MODE) {
                    return menuDisposables;
                }

                // context menu destroy event
                [
                    menu.onDidBlur,
                    menu.onDidClose,
                    new DomEmitter(window, EventType.blur).registerListener,
                ]
                .forEach(onEvent => {
                    menuDisposables.register(
                        onEvent.call(menu, () => this._contextMenu.destroy())
                    );
                });

                // mousedown destroy event
                menuDisposables.register(addDisposableListener(window, EventType.mousedown, (e) => {
                    if (e.defaultPrevented) {
                        return;
                    }

                    /**
                     * We are likely creating a context menu, let the context 
                     * menu service to destroy it.
                     */
                    if (DomEventHandler.isRightClick(e)) {
                        return;
                    }

                    // clicking the child element will not destroy the view.
                    if (DomUtility.Elements.isAncestor(container, <HTMLElement | undefined>e.target)) {
                        return;
                    }

                    this._contextMenu.destroy();
                }));

                return menuDisposables;
            },

            onBeforeDestroy: () => {
                // TEST
                console.log('delegate: on before destroy');
            },
        };
    }
}
