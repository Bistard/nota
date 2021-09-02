import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { MarkdownComponent } from "src/code/browser/workbench/editor/markdown/markdown";
import { TitleBarComponent } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { createDecorator } from "src/code/common/service/instantiation/decorator";

export enum EditorComponentType {
    titleBar = 'title-bar',
    functionBar = 'function-bar',
    tabBar = 'tab-bar',
    windowBar = 'window-bar',
}

export const IEditorService = createDecorator<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

}

export class EditorComponent extends Component implements IEditorService {

    private titleBarComponent!: TitleBarComponent;
    private markdownComponent!: MarkdownComponent;

    constructor(
        parentComponent: Component,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
        
    ) {
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

        this.markdownComponent = new MarkdownComponent(this, markdownView, this.contextMenuService);
        this.markdownComponent.create();

        this.container.appendChild(markdownView);
    }

}