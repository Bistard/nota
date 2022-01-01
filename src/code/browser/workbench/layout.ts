import { Button } from "src/base/browser/basic/button";
import { IComponentService } from "src/code/browser/service/componentService";
import { ActionBarComponent } from "src/code/browser/workbench/actionBar/actionBar";
import { ActionViewComponent, ActionViewType } from "src/code/browser/workbench/actionView/actionView";
import { ExplorerViewComponent } from "src/code/browser/workbench/actionView/explorer/explorer";
import { Component, ComponentType } from "src/code/browser/workbench/component";

/**
 * @description A base class for Workbench to create and manage the behaviour of
 * each sub-component.
 */
export abstract class WorkbenchLayout extends Component {

    constructor(
        componentService: IComponentService
    ) {
        super('workbench', null, document.body, componentService);
    }

    protected _createLayout(): void {

        // ...

        /**
         * Listens to action bar button click listener and notifies the 
         * actionView to swtich the view.
         */
        const actionBar = this.componentService.get(ComponentType.ActionBar) as ActionBarComponent;
        const actionView = this.componentService.get(ComponentType.ActionView) as ActionViewComponent;
        const [explorer, outline, search, git] = [actionBar.buttonGroups[0]!, actionBar.buttonGroups[1]!, actionBar.buttonGroups[2]!, actionBar.buttonGroups[3]!];
        
        [
            [explorer, 'explorer'],
            [outline, 'outline'],
            [outline, 'search'],
            [outline, 'git'],
        ]
        .forEach(pair => {
            const button = pair[0] as Button;
            const type = pair[1] as ActionViewType;

            this.__register(button.onDidClick((event: Event) => {
                actionView.onActionViewChange(type);
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