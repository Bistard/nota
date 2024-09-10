import 'src/workbench/parts/workspace/workspace.scss';
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, IComponent } from "src/workbench/services/component/component";
import { TitleBar } from "src/workbench/parts/workspace/titleBar/titleBar";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IThemeService } from "src/workbench/services/theme/themeService";
import { ILogService } from "src/base/common/logger";
import { OPERATING_SYSTEM, Platform } from 'src/base/common/platform';

export const IWorkspaceService = createService<IWorkspaceService>('workspace-service');

/**
 * An interface only for {@link WorkspaceComponent}.
 */
export interface IWorkspaceService extends IComponent, IService {

}

export class WorkspaceComponent extends Component implements IWorkspaceService {

    declare _serviceMarker: undefined;

    // [field]

    private titleBar!: TitleBar;
    private editor!: IEditorService;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('workspace', null, themeService, componentService, logService);
    }

    // [protected override methods]

    protected override _createContent(): void {
        if (OPERATING_SYSTEM === Platform.Windows) {
            this._createTitleBar();
        }
        this._createEditor();
    }

    protected override _registerListeners(): void {
        if (OPERATING_SYSTEM === Platform.Windows) {
            this.titleBar.registerListeners();
        }
        this.editor.registerListeners();
    }

    // [public method]

    // [private helper methods]

    private _createTitleBar(): void {
        this.titleBar = this.instantiationService.createInstance(TitleBar);
        this.titleBar.create(this);
    }

    private _createEditor(): void {
        this.editor = this.instantiationService.getOrCreateService(IEditorService);
        this.editor.create(this);
    }
}