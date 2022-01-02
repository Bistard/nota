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

    constructor(
        componentService: IComponentService
    ) {
        super(ComponentType.Workbench, null, document.body, componentService);
    }

    protected _createLayout(): void {

        // ...

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
        

        // todo...


        // const explorer = this.componentService.get(ComponentType.ExplorerView) as ExplorerViewComponent;
        // this.__register(explorer.onDidVisibilityChange((visible: boolean) => {
        //     
        // }));


        // ...

    }

}