import 'functionBar.scss'; // TODO
import { Emitter, Register } from 'src/base/common/event';
import { SideButton, ISideButtonOptions } from 'src/workbench/parts/sideBar/sideBarButton';

export interface IFunctionBarButtonClickEvent {
    readonly id: string;
}

export class FunctionBar {
    private buttons: SideButton[] = [];
    private readonly onDidButtonClick = new Emitter<IFunctionBarButtonClickEvent>();

    constructor(private container: HTMLElement) {
        // Initialize the function bar container
        this.container.className += ' function-bar';
        // Add buttons or other elements as needed
    }

    // Method to add a button to the function bar
    public addButton(opts: ISideButtonOptions): void {
        const button = new SideButton(opts);

        // Optionally, check if the button with the given ID already exists to avoid duplicates
        // Add the button to the array
        this.buttons.push(button);

        // Render the button inside the function bar container
        button.render(this.container);

        // Listen to the button click event
        button.onDidClick(() => {
            this.onDidButtonClick.fire({
                id: opts.id
            });
        });
    }

    public get onButtonClick(): Register<IFunctionBarButtonClickEvent> {
        return this.onDidButtonClick.registerListener;
    }
}
