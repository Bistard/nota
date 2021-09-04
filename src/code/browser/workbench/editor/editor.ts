import { IComponentService } from "src/code/browser/service/componentService";
import { IContextMenuService } from "src/code/browser/service/contextMenuService";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { MarkdownComponent } from "src/code/browser/workbench/editor/markdown/markdown";
import { TabBarComponent } from "src/code/browser/workbench/editor/tabBar/tabBar";
import { TitleBarComponent } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { INoteBookManagerService, NoteBookManager } from "src/code/common/model/notebookManger";
import { createDecorator } from "src/code/common/service/instantiation/decorator";


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
        @INoteBookManagerService noteBookManagerService: INoteBookManagerService,
        @IComponentService componentService: IComponentService,
        @IContextMenuService private readonly contextMenuService: IContextMenuService,
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

        this.markdownComponent = new MarkdownComponent(this, markdownView, this.componentService, this.contextMenuService);
        this.markdownComponent.create();

        this.container.appendChild(markdownView);
    }

}