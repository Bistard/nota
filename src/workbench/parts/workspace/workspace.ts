// import 'src/workbench/parts/workspace/media/workspace.scss';
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IComponent } from "src/workbench/services/component/component";
import { TitleBar } from "src/workbench/parts/workspace/titleBar/titleBar";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IThemeService } from "src/workbench/services/theme/themeService";

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

export interface IWorkspaceService extends IComponent, IService {

}

export class WorkspaceComponent extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

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