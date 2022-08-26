import { IComponentService } from "src/code/browser/service/component/componentService";
import { Component, ComponentType, IComponent } from "src/code/browser/service/component/component";
import { MarkdownComponent } from "src/code/browser/workbench/workspace/markdown/markdown";
import { TitleBarComponent } from "src/code/browser/workbench/workspace/titleBar/titleBar";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { EditorComponent, IEditorService } from "src/code/browser/workbench/workspace/editor/editor";
import { IThemeService } from "src/code/browser/service/theme/themeService";

export const enum WorkspaceComponentType {
    titleBar = 'title-bar',
    tabBar = 'tab-bar',
    editor = 'editor',
}

export const IWorkspaceService = createDecorator<IWorkspaceService>('workspace-service');

export interface IWorkspaceService extends IComponent {

}

/**
 * @class // TODO
 */
export class WorkspaceComponent extends Component implements IWorkspaceService {

    // [field]

    private titleBarComponent!: TitleBarComponent;
    private editorComponent!: EditorComponent;
    private markdownComponent!: MarkdownComponent;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
    ) {
        super(ComponentType.Workspace, null, themeService, componentService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        this._createTitleBar();
        this._createEditor();
    }

    protected override _registerListeners(): void {
        this.titleBarComponent.registerListeners();
        this.editorComponent.registerListeners();
        // this.markdownComponent.registerListeners();
    }

    // [public method]

    // [private helper methods]

    private _createTitleBar(): void {
        this.titleBarComponent = this.instantiationService.createInstance(TitleBarComponent);
        this.titleBarComponent.create(this);
    }

    private _createEditor(): void {
        this.editorComponent = this.instantiationService.getOrCreateService(IEditorService) as EditorComponent;
        this.editorComponent.create(this);
    }

    private _createMarkdown(): void {
        const markdownView = document.createElement('div');
        markdownView.id = 'markdown-view';

        this.markdownComponent = this.instantiationService.createInstance(MarkdownComponent, markdownView);
        this.markdownComponent.create(this);

        this.element.appendChild(markdownView);
    }

}