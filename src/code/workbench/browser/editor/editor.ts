import { IEventEmitter } from "src/base/common/event";
import { Component, ComponentType } from "src/code/workbench/browser/component";
import { MarkdownComponent } from "src/code/workbench/browser/editor/markdown/markdown";
import { TitleBarComponent } from "src/code/workbench/browser/editor/titleBar/titleBar";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class EditorComponent extends Component {

    private _eventEmitter: IEventEmitter;

    public titleBarView!: HTMLElement;
    public markdownView!: HTMLElement;
    
    private titleBarComponent!: TitleBarComponent;
    private markdownComponent!: MarkdownComponent;

    constructor(registerService: IRegisterService,
                _eventEmitter: IEventEmitter
    ) {
        super(ComponentType.editor, registerService);

        this._eventEmitter = _eventEmitter;
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
        this.titleBarComponent.registerListeners();

    }

    private _createTitleBar(): void {
        const titleBar = document.createElement('div');
        titleBar.id = 'title-bar';

        this.titleBarComponent = new TitleBarComponent(this, this._eventEmitter);
        this.titleBarComponent.create(titleBar);

        this.titleBarView = titleBar;
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = new MarkdownComponent(this, this._eventEmitter);
        this.markdownComponent.create(markdownView);

        this.markdownView = markdownView;
    }

}