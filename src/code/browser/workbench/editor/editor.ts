import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { IMarkdownService, MarkdownComponent } from "src/code/browser/workbench/editor/markdown/markdown";
import { TabBarComponent } from "src/code/browser/workbench/editor/tabBar/tabBar";
import { TitleBarComponent } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { INoteBookManagerService } from "src/code/common/model/notebookManager";
import { IFileLogService } from "src/code/common/service/fileLogService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export enum EditorComponentType {
    titleBar = 'title-bar',
    tabBar = 'tab-bar',
    markdown = 'markdown',
}

export const IEditorService = createDecorator<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

}

export class EditorComponent extends Component implements IEditorService {

    private titleBarComponent!: TitleBarComponent;
    private tabBarComponent!: TabBarComponent;
    private markdownComponent!: MarkdownComponent;

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
        @IFileLogService private readonly fileLogService: IFileLogService,
    ) {
        super(ComponentType.editor, parentComponent, null, componentService);
    }

    protected override _createContent(): void {
        this._createTitleBar();
        this._createTabBar();
        this._createMarkdown();
    }

    protected override _registerListeners(): void {
        this.titleBarComponent.registerListeners();
        this.tabBarComponent.registerListeners();
        this.markdownComponent.registerListeners();
    }

    private _createTitleBar(): void {
        this.titleBarComponent = new TitleBarComponent(this, this.componentService);
        this.titleBarComponent.create();
    }

    private _createTabBar(): void {
        this.tabBarComponent = new TabBarComponent(this, this.componentService);
        this.tabBarComponent.create();
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = new MarkdownComponent(this, markdownView, this.componentService, this.contextMenuService, this.fileLogService);
        this.markdownComponent.create();

        this.container.appendChild(markdownView);
    }

}
