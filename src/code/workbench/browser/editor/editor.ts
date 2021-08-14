import { Component, ComponentType } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class EditorComponent extends Component {

    // titleBarComponent...
    titleBarComponent!: any;

    // markdownComponent...
    markdownComponent!: any;

    constructor(registerService: IRegisterService) {
        super(ComponentType.editor, registerService);

        this.registerService = registerService;
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize...
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'editor-view-container';

        this.titleBarComponent = this._createTitleBarComponent();
        this.markdownComponent = this._createMarkdownComponent();

        this.contentArea.appendChild(this.titleBarComponent);
        this.contentArea.appendChild(this.markdownComponent);
        
        this.container.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {
        
    }

    private _createTitleBarComponent(): void {

    }

    private _createMarkdownComponent(): void {

    }

}