import { ISashEvent, Sash } from "src/base/browser/basic/sash/sash";
import { addDisposableListener, DomUtility, EventType, Orientation } from "src/base/common/dom";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { ActionBarComponent, IActionBarService } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent, IActionViewService } from "src/code/browser/workbench/actionView/actionView";
import { Component, ComponentType, IComponent } from "src/code/browser/service/component/component";
import { IWorkspaceService } from "src/code/browser/workbench/workspace/workspace";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [fields]

    // TODO: refactor using SplitView
    protected sashContainer: HTMLElement | undefined;
    protected sashMap = new Map<string, Sash>();

    // [constructor]
    
    constructor(
        parent: HTMLElement,
        protected readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IActionViewService private readonly actionViewService: IActionViewService,
        @IWorkspaceService private readonly workspaceService: IWorkspaceService,
    ) {
        super(ComponentType.Workbench, parent, themeService, componentService);
    }

    // [protected methods]

    public override layout(): void {
        if (this.isDisposed() || !this.parent) {
            return;
        }
        DomUtility.setFastPosition(this.element, 0, 0, 0, 0, 'relative');
        super.layout(undefined, undefined);
    }

    // [protected helper methods]

    protected __createLayout(): void {
        
        /**
         * Constructs each component of the workbench.
         */
        [
            this.actionBarService,
            this.actionViewService,
            this.workspaceService
        ]
        .forEach((component: IComponent) => {
            component.create(this);
            component.registerListeners();
        });

        this._createSashContainer();
    }

    protected __registerLayoutListeners(): void {
        
        // window resizing
        this.__register(addDisposableListener(window, EventType.resize, (event => {
            this.layout();
        })));

        /**
         * @readonly Listens to each ActionBar button click events and notifies 
         * the actionView to swtich the view.
         */
        this.actionBarService.onDidButtonClick(e => {
            this.actionViewService.setActionView(e.type);
        });

        /**
         * @readonly Registers {@link Sash} listeners.
         */

        const sash = this.sashMap.get('sash-1')!;
        sash.onDidMove((e: ISashEvent) => {
            const newX = e.currentX - ActionBarComponent.width;
            this.actionViewService.element.setWidth(newX);
            this.actionViewService.element.setMinWidth(newX);
        });

        sash.onDidReset(() => {
            this.actionViewService.element.setWidth(ActionViewComponent.width);
            this.actionViewService.element.setMinWidth(ActionViewComponent.width);
        });
    }

    // [private helper functions]

    // TODO: remove
    private _registerSash(id: string, sash: Sash): Sash {
        this.sashMap.set(id, sash);
        return sash;
    }

    // TODO: remove
    private _createSashContainer(): void {

        if (this.sashContainer) {
            return;
        }

        // create sash containers to DOM (document.body)
        this.sashContainer = document.createElement('div');
        this.sashContainer.classList.add('sash-container');
        this.element.appendChild(this.sashContainer);

        [
            this._registerSash('sash-1', new Sash(this.sashContainer, {
                orientation: Orientation.Vertical, 
                initPosition: ActionBarComponent.width + ActionViewComponent.width + 3, 
                range: { start: 200, end: 600 }
            })),
        ]
        .forEach((sash: Sash) => {
            sash.registerListeners();
        });

    }

}