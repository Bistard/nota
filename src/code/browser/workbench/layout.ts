import { ISashEvent, Sash } from "src/base/browser/basic/sash/sash";
import { addDisposableListener, EventType, Orientation } from "src/base/common/dom";
import { DomEmitter, Emitter, Register } from "src/base/common/event";
import { IComponentService } from "src/code/browser/service/componentService";
import { ActionBarComponent, ActionType } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent } from "src/code/browser/workbench/actionView/actionView";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { WorkspaceComponent } from "src/code/browser/workbench/workspace/workspace";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [events]

    protected _onDidFinishLayout: Emitter<void> = this.__register(new Emitter<void>());
    public onDidFinishLayout: Register<void> = this._onDidFinishLayout.registerListener;

    // [fields]

    protected actionBar!: ActionBarComponent;
    protected actionView!: ActionViewComponent;
    protected workspace!: WorkspaceComponent;
    
    // TODO: refactor using SplitView
    protected sashContainer: HTMLElement | undefined;
    protected sashMap = new Map<string, Sash>();

    // [constructor]
    
    constructor(
        protected readonly instantiationService: IInstantiationService,
        @IComponentService componentService: IComponentService,
    ) {
        super(ComponentType.Workbench, document.body, componentService);
    }

    // [protected methods]

    protected __createLayout(): void {
        
        /**
         * Constructs each component of the workbench.
         */
        this.actionBar = this.instantiationService.createInstance(ActionBarComponent);
        this.actionView = this.instantiationService.createInstance(ActionViewComponent, ActionType.EXPLORER /* // TODO: should read from config */);
        this.workspace = this.instantiationService.createInstance(WorkspaceComponent);
        
        [
            this.actionBar,
            this.actionView,
            this.workspace
        ]
        .forEach((component: IComponent) => {
            component.create(this);
            component.registerListeners();
        });

        this._createSashContainer();

        this._onDidFinishLayout.fire();
    }

    protected __registerLayout(): void {
        
        this.__register(new DomEmitter<UIEvent>(window, EventType.resize).registerListener(event => {
            // REVIEW
            console.log('resizing:', event);
        }));

        /**
         * @readonly Listens to each ActionBar button click events and notifies 
         * the actionView to swtich the view.
         */
        this.actionBar.onDidButtonClick(e => {
            this.actionView.setActionView(e.type);
        });

        /**
         * @readonly Registers {@link Sash} listeners.
         */

        const sash = this.sashMap.get('sash-1')!;
        sash.onDidMove((e: ISashEvent) => {
            const newX = e.currentX - ActionBarComponent.width;
            this.actionView.container.style.width = newX + 'px';
            this.actionView.container.style.minWidth = newX + 'px';
        });

        sash.onDidReset(() => {
            this.actionView.container.style.width = ActionViewComponent.width + 'px';
            this.actionView.container.style.minWidth = ActionViewComponent.width + 'px';
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
        this.container.append(this.sashContainer);

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