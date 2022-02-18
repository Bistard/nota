import { Button } from "src/base/browser/basic/button/button";
import { ISashEvent, Sash } from "src/base/browser/basic/sash/sash";
import { Orientation } from "src/base/common/dom";
import { Emitter, Register } from "src/base/common/event";
import { IComponentService } from "src/code/browser/service/componentService";
import { IIpcService } from "src/code/browser/service/ipcService";
import { ActionBarComponent, ActionType } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent } from "src/code/browser/workbench/actionView/actionView";
import { Component, ComponentType, ICreateable } from "src/code/browser/workbench/component";
import { EditorComponent } from "src/code/browser/workbench/editor/editor";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // [events]

    protected _onDidFinishLayout: Emitter<void> = this.__register(new Emitter<void>());
    public onDidFinishLayout: Register<void> = this._onDidFinishLayout.registerListener;

    // [fields]

    protected actionBarComponent!: ActionBarComponent;
    protected actionViewComponent!: ActionViewComponent;
    protected editorComponent!: EditorComponent;
    
    protected sashContainer: HTMLElement | undefined;
    protected sashMap = new Map<string, Sash>();

    // [constructor]
    
    constructor(
        protected readonly instantiationService: IInstantiationService,
        componentService: IComponentService,
        protected readonly ipcService: IIpcService,
    ) {
        super(ComponentType.Workbench, null, document.body, componentService);
    }

    // [protected methods]

    protected createLayout(): void {
        
        /**
         * Constructs each component of the workbench.
         */
        this.actionBarComponent = this.instantiationService.createInstance(ActionBarComponent, this);
        this.actionViewComponent = this.instantiationService.createInstance(ActionViewComponent, this);
        this.editorComponent = this.instantiationService.createInstance(EditorComponent, this);
        
        [
            this.actionBarComponent,
            this.actionViewComponent,
            this.editorComponent
        ]
        .forEach((component: ICreateable) => {
            component.create();
            component.registerListeners();
        });

        this._createSashContainer();

    }

    protected registerLayout(): void {
        
        /**
         * @readonly Listens to each ActionBar button click events and notifies 
         * the actionView to swtich the view.
         */
        const [explorer, outline, search, git] = [
            this.actionBarComponent.getButton(ActionType.EXPLORER)!, this.actionBarComponent.getButton(ActionType.OUTLINE)!, 
            this.actionBarComponent.getButton(ActionType.SEARCH)!, this.actionBarComponent.getButton(ActionType.GIT)!
        ];
        
        [
            [explorer, ActionType.EXPLORER],
            [outline, ActionType.OUTLINE],
            [search, ActionType.SEARCH],
            [git, ActionType.GIT],
        ]
        .forEach(pair => {
            const button = pair[0] as Button;
            const type = pair[1] as ActionType;

            this.__register(button.onDidClick((event: Event) => {
                this.actionBarComponent.actionButtonClick(type);
                this.actionViewComponent.actionViewChange(type);
            }));
        });

        /**
         * @readonly Registers {@link Sash} listeners.
         */

        const sash = this.sashMap.get('sash-1')!;
        sash.onDidMove((e: ISashEvent) => {
            const newX = e.currentX - ActionBarComponent.width;
            this.actionViewComponent.container.style.width = newX + 'px';
            this.actionViewComponent.container.style.minWidth = newX + 'px';
        });

        sash.onDidReset(() => {
            this.actionViewComponent.container.style.width = ActionViewComponent.width + 'px';
            this.actionViewComponent.container.style.minWidth = ActionViewComponent.width + 'px';
        });
    }

    // [private helper functions]

    private _registerSash(id: string, sash: Sash): Sash {
        this.sashMap.set(id, sash);
        return sash;
    }

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
                defaultPosition: ActionBarComponent.width + ActionViewComponent.width + 3, 
                range: { start: 200, end: 600 }
            })),
        ]
        .forEach((sash: Sash) => {
            sash.create();
            sash.registerListeners();
        });

    }

}