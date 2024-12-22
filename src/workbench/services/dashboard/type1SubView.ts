import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Disposable } from "src/base/common/dispose";

export class Type1SubView extends Disposable implements IDashboardSubView {

    // [fields]

    public id: string = 'type1';

    // [constructor]

    constructor(
        private opts: IDashboardSubViewOpts
    ) {
        super();
    }

    // [public methods]

    public render(): HTMLElement {
        const subViewContainer = document.createElement("div");
        subViewContainer.classList.add("type1-subview");
        subViewContainer.setAttribute("data-id", this.opts.id);

        // Create section header
        const header = document.createElement("div");
        header.classList.add("section-header");

        // Title for the section
        const title = document.createElement("h2");
        title.textContent = this.opts.title || "Welcome to the Dashboard";
        header.appendChild(title);

        subViewContainer.appendChild(header);

        // Add the New Note button
        const newNoteButton = this.__createNewNoteButton();
        subViewContainer.appendChild(newNoteButton);

        return subViewContainer;
    }

    public registerListeners(): void {
        if (this.isDisposed()) {
            return;
        }

        // this.__register(addDisposableListener(this._element, EventType.mousedown, e => this.__initDrag(e)));
    }

    // [private methods]

    private __createNewNoteButton(): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("new-note-btn");
        button.textContent = "New Note";
        button.addEventListener("click", () => {
            console.log("New Note button clicked");
        });
        return button;
    }
}
