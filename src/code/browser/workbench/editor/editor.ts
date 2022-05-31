import { IComponentService } from "src/code/browser/service/componentService";
import { Component, ComponentType, IComponent } from "src/code/browser/workbench/component";
import { MarkdownComponent } from "src/code/browser/workbench/editor/markdown/markdown";
import { TitleBarComponent } from "src/code/browser/workbench/editor/titleBar/titleBar";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { registerSingleton } from "src/code/common/service/instantiationService/serviceCollection";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { IInstantiationService } from "src/code/common/service/instantiationService/instantiation";

export const enum EditorComponentType {
    titleBar = 'title-bar',
    tabBar = 'tab-bar',
    markdown = 'markdown',
}

export const IEditorService = createDecorator<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

}

/**
 * @class // TODO
 */
export class EditorComponent extends Component implements IEditorService {

    // [field]

    private titleBarComponent!: TitleBarComponent;
    private markdownComponent!: MarkdownComponent;

    // [constructor]

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super(ComponentType.Editor, parentComponent, null, componentService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this._createTitleBar();
        this._createMarkdown();
    }

    protected override _registerListeners(): void {
        this.titleBarComponent.registerListeners();
        this.markdownComponent.registerListeners();
    }

    // [public method]


    // [private helper methods]

    private _createTitleBar(): void {
        this.titleBarComponent = this.instantiationService.createInstance(TitleBarComponent, this);
        this.titleBarComponent.create();
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