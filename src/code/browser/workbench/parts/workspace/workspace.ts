// import 'src/code/browser/workbench/parts/workspace/media/workspace.scss';
import { IComponentService } from "src/code/browser/service/component/componentService";
import { Component, IComponent } from "src/code/browser/service/component/component";
import { TitleBar } from "src/code/browser/workbench/parts/workspace/titleBar/titleBar";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { IEditorService } from "src/code/browser/workbench/parts/workspace/editor/editorService";

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

export interface IWorkspaceService extends IComponent {

}

/**
 * @class // TODO
 */
export class WorkspaceComponent extends Component implements IWorkspaceService {

    // [field]

    private titleBarComponent!: TitleBar;
    private editorComponent!: IEditorService;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
    ) {
        super('workspace', null, themeService, componentService);
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
        this.titleBarComponent = this.instantiationService.createInstance(TitleBar);
        this.titleBarComponent.create(this);
    }

    private _createEditor(): void {
        this.editorComponent = this.instantiationService.getOrCreateService(IEditorService);
        this.editorComponent.create(this);
    }
}