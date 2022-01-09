import { Button } from "src/base/browser/basic/button/button";
import { IComponentService } from "src/code/browser/service/componentService";
import { ActionBarComponent, ActionType } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent } from "src/code/browser/workbench/actionView/actionView";
import { Component, ComponentType } from "src/code/browser/workbench/component";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    // this variable is to store the x-coordinate of the resizeBar in the explorer view
    protected _resizeX: number = 0;
    protected resize!: HTMLElement;

    constructor(
        componentService: IComponentService
    ) {
        super(ComponentType.Workbench, null, document.body, componentService);
    }

    protected _createLayout(): void {

    }

    protected _registerLayout(): void {
        
        /**
         * @readonly Listens to each ActionBar button click events and notifies 
         * the actionView to swtich the view.
         */
        const actionBar = this.componentService.get(ComponentType.ActionBar) as ActionBarComponent;
        const actionView = this.componentService.get(ComponentType.ActionView) as ActionViewComponent;
        const [explorer, outline, search, git] = [
            actionBar.getButton(ActionType.EXPLORER)!, actionBar.getButton(ActionType.OUTLINE)!, 
            actionBar.getButton(ActionType.SEARCH)!, actionBar.getButton(ActionType.GIT)!
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
                actionBar.actionButtonClick(type);
                actionView.actionViewChange(type);
            }));
        });
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    /**
     * @description callback functions for resize folder view.
     */
    protected _resizeSash(event: MouseEvent): void {

        // minimum width for folder view to be resized
        if (event.x < 200) {
            return;
        }

        const explorerView = document.getElementById('action-view') as HTMLElement;
        const contentView = document.getElementById('editor-view') as HTMLElement;
        let dx = this._resizeX - event.x;
        this._resizeX = event.x;
        /* new X has to be calculated first, than concatenates with "px", otherwise
           the string will be like newX = "1000+2px" and losing accuracy */
        let explorerViewNewX = parseInt(getComputedStyle(explorerView, '').width) - dx;
        let contentViewNewX = parseInt(getComputedStyle(contentView, '').width) + dx;
        
        explorerView.style.width = explorerViewNewX + "px";
        explorerView.style.minWidth = explorerViewNewX + "px";
        contentView.style.width = contentViewNewX + "px";
    }

}