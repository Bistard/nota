import { Component, ComponentType } from "src/code/workbench/browser/component";
import { MarkdownComponent } from "src/code/workbench/browser/editor/markdown/markdown";
import { TitleBarModule } from "src/code/workbench/browser/editor/titleBar/titleBar";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class EditorComponent extends Component {

    titleBarView!: HTMLElement;
    titleBarComponent!: TitleBarModule;

    markdownView!: HTMLElement;
    markdownComponent!: MarkdownComponent;

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

        this._createTitleBar();
        this._createMarkdown();

        this.contentArea.appendChild(this.titleBarView);
        this.contentArea.appendChild(this.markdownView);

        this.container.appendChild(this.contentArea);
    }

    protected override _registerListeners(): void {
        
        this.markdownComponent.registerListeners();

        // register title bar

    }

    // TODO
    private _createTitleBar(): void {
        const titleBar = document.createElement('div');
        titleBar.id = 'title-bar';

        const toolBar = document.createElement('div');
        toolBar.id = 'tool-bar';

        this.titleBarView = titleBar;
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = new MarkdownComponent(this);
        this.markdownComponent.create(markdownView);

        this.markdownView = markdownView;
    }

}