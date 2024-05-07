import 'src/workbench/parts/workspace/editor/media/editor.scss';
import { URI } from "src/base/common/files/uri";
import { IComponentService } from "src/workbench/services/component/componentService";
import { Component, } from "src/workbench/services/component/component";
import { IFileService } from "src/platform/files/common/fileService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { ExplorerViewID, IExplorerViewService } from "src/workbench/contrib/explorer/explorerService";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { ILogService } from "src/base/common/logger";
import { IEditorWidgetOptions } from "src/editor/common/configuration/editorConfiguration";
import { deepCopy } from "src/base/common/utilities/object";
import { IEditorService } from "src/workbench/parts/workspace/editor/editorService";
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IConfigurationService } from 'src/platform/configuration/common/configuration';
import { EditorWidget, IEditorWidget } from 'src/editor/editorWidget';
import { EditorType } from 'src/editor/common/viewModel';
import { getBuiltInExtension } from 'src/editor/common/extension/builtInExtension';
import { INavigationViewService } from 'src/workbench/parts/navigationPanel/navigationView/navigationView';
import { panic } from 'src/base/common/utilities/panic';

export class Editor extends Component implements IEditorService {

    declare _serviceMarker: undefined;

    // [field]

    private _editorWidget: IEditorWidget | null;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @IThemeService themeService: IThemeService,
        @INavigationViewService private readonly navigationViewService: INavigationViewService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @ILogService logService: ILogService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super('editor', null, themeService, componentService, logService);
        this._editorWidget = null;
        this.logService.trace('EditorService', 'Constructed.');
    }

    // [getter]

    get editor(): IEditorWidget | null {
        return this._editorWidget ?? null;
    }

    // [public methods]

    public openSource(source: URI | string): void {
        if (!this._editorWidget) {
            panic(`[Editor] Cannot open ${URI.isURI(source) ? URI.toString(source) : source} - service is currently not created.`);
        }

        
        const uri = URI.isURI(source) ? source : URI.fromFile(source);
        this._editorWidget.open(uri);
    }

    // [override protected methods]

    protected override async _createContent(): Promise<void> {
        await this.lifecycleService.when(LifecyclePhase.Ready);
        const options = <IEditorWidgetOptions>deepCopy(this.configurationService.get('editor', {}));

        // building options
        const explorerView = this.navigationViewService.getView<IExplorerViewService>(ExplorerViewID);
        if (explorerView?.root) {
            options.baseURI = URI.toFsPath(explorerView.root);
        }

        this.logService.debug('EditorService', 'Constructing editor...');

        // editor construction
        const editor = this.instantiationService.createInstance(
            EditorWidget, 
            this.element.element,
            getBuiltInExtension(),
            {
                mode: EditorType.Rich,
            },
        );
        this._editorWidget = editor;

        this.logService.debug('EditorService', 'Editor constructed.');
    }

    protected override async _registerListeners(): Promise<void> {

        /**
         * It should be a better idea to collect all the settings and options 
         * and register the editor related listeners when the browser-side 
         * lifecycle turns into ready state.
         */
        await this.lifecycleService.when(LifecyclePhase.Ready);

        // building options
        const explorerView = this.navigationViewService.getView<IExplorerViewService>(ExplorerViewID);
        if (explorerView) {
            explorerView.onDidOpen((e) => {
                // FIX
                // this._editorWidget?.updateOptions({ baseURI: URI.toFsPath(e.path) });
            });
        }
    }

    // [private helper methods]

}