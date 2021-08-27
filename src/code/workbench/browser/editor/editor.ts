import { Component, ComponentType } from "src/code/workbench/browser/component";
import { MarkdownComponent } from "src/code/workbench/browser/editor/markdown/markdown";
import { TitleBarComponent } from "src/code/workbench/browser/editor/titleBar/titleBar";

export enum EditorComponentType {
    titleBar = 'title-bar',
    functionBar = 'function-bar',
    tabBar = 'tab-bar',
    windowBar = 'window-bar',
}

export class EditorComponent extends Component {

    private titleBarComponent!: TitleBarComponent;
    private markdownComponent!: MarkdownComponent;

    constructor(parentComponent: Component) {
        super(ComponentType.editor, parentComponent);
    }

    protected override _createContent(): void {
        this._createTitleBar();
        this._createMarkdown();
    }

    protected override _registerListeners(): void {
        this.titleBarComponent.registerListeners();
        this.markdownComponent.registerListeners();
    }

    private _createTitleBar(): void {
        this.titleBarComponent = new TitleBarComponent(this);
        this.titleBarComponent.create();
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = new MarkdownComponent(this, markdownView);
        this.markdownComponent.create();

        this.container.appendChild(markdownView);
    }

}