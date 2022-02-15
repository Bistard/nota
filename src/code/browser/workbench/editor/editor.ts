import { IComponentService } from "src/code/browser/service/componentService";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { MarkdownComponent } from "src/code/browser/workbench/editor/markdown/markdown";
import { TabBarComponent } from "src/code/browser/workbench/editor/tabBar/tabBar";
import { TitleBarComponent } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { registerSingleton } from "src/code/common/service/instantiationService/serviceCollection";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";
import { Register } from "src/base/common/event";

export const enum EditorComponentType {
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
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super(ComponentType.Editor, parentComponent, null, componentService);
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
        this.titleBarComponent = this.instantiationService.createInstance(TitleBarComponent, this);
        this.titleBarComponent.create();
    }

    private _createTabBar(): void {
        this.tabBarComponent = this.instantiationService.createInstance(TabBarComponent, this);
        this.tabBarComponent.create();
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = this.instantiationService.createInstance(MarkdownComponent, this, markdownView);
        this.markdownComponent.create();

        this.container.appendChild(markdownView);
    }

}

registerSingleton(IEditorService, new ServiceDescriptor(EditorComponent));