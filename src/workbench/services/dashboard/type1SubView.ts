import { IDashboardSubView, IDashboardSubViewOpts } from "src/workbench/services/dashboard/dashboardSubView";
import { Disposable } from "src/base/common/dispose";
import { addDisposableListener } from "src/base/browser/basic/dom";

export class Type1SubView extends Disposable implements IDashboardSubView {

    // [fields]

    public id: string = 'type1';
    private _subViewContainer: HTMLElement;

    // [constructor]

    constructor(
        private opts: IDashboardSubViewOpts
    ) {
        super();
        this._subViewContainer = document.createElement("div");
        this._subViewContainer.classList.add("type1-subview");
        this._subViewContainer.setAttribute("data-id", this.opts.id);
    }

    // [public methods]

    public render(): HTMLElement {

        this._subViewContainer.innerHTML = "";

        // Create section header
        const header = document.createElement("div");
        header.classList.add("section-header");

        // Title for the section
        const title = document.createElement("h2");
        title.textContent = this.opts.title || "Welcome to the Dashboard";
        header.appendChild(title);

        this._subViewContainer.appendChild(header);

        // Add the New Note button
        const newNoteButton = this.__createNewNoteButton();
        this._subViewContainer.appendChild(newNoteButton);

        return this._subViewContainer;
    }

    // [protected methods]

    public override dispose(): void {
        super.dispose();
        this._subViewContainer.remove();
    }

    // [private methods]

    private __createNewNoteButton(): HTMLElement {
        const button = document.createElement("button");
        button.classList.add("new-note-btn");
        button.textContent = "+ New Note";
        this.__register(addDisposableListener(button, "click", () => {
            console.log("New Note button clicked");
        }));
        return button;
    }
}
