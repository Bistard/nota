import 'src/code/browser/workbench/parts/workspace/editor/media/editor.scss';
import { URI } from "src/base/common/file/uri";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { Component,  } from "src/code/browser/service/component/component";
import { IFileService } from "src/code/platform/files/common/fileService";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { EditorWidget, IEditorWidget } from "src/editor/editorWidget";
import { ISideViewService } from "src/code/browser/workbench/parts/sideView/sideView";
import { ExplorerViewID, IExplorerViewService } from "src/code/browser/workbench/contrib/explorer/explorerService";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { ILogService } from "src/base/common/logger";
import { IEditorWidgetOptions } from "src/editor/common/configuration/editorConfiguration";
import { deepCopy } from "src/base/common/util/object";
import { IEditorService } from "src/code/browser/workbench/parts/workspace/editor/editorService";
import { IThemeService } from 'src/code/browser/service/theme/themeService';
import { IConfigurationService } from 'src/code/platform/configuration/common/configuration';

export class Editor extends Component implements IEditorService {

    // [field]

    private _editorWidget: IEditorWidget | null;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @IThemeService themeService: IThemeService,
        @ISideViewService private readonly sideViewService: ISideViewService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
    ) {
        super('editor', null, themeService, componentService);
        this._editorWidget = null;
    }

    // [getter]

    get editor(): IEditorWidget | null {
        return this._editorWidget ?? null;
    }

    // [public methods]

    public openSource(source: URI | string): void {
        
        if (!this._editorWidget) {
            throw new Error(`[Editor] Cannot open ${URI.isURI(source) ? URI.toString(source) : source} - service is currently not created.`);
        }
        
        const uri = URI.isURI(source) ? source : URI.fromFile(source);
        this._editorWidget.open(uri);
    }

    // [override protected methods]

    protected override async _createContent(): Promise<void> {

        await this.lifecycleService.when(LifecyclePhase.Ready);
            
        const options = <IEditorWidgetOptions>deepCopy(this.configurationService.get('editor', {}));

        // building options
        const explorerView = this.sideViewService.getView<IExplorerViewService>(ExplorerViewID);
        if (explorerView?.root) {
            options.baseURI = URI.toFsPath(explorerView.root);
        }

        // editor widget construction
        // FIX
        // const editor = this.instantiationService.createInstance(EditorWidget, this.element.element, options);
        // (<Mutable<EditorWidget>>this._editorWidget) = editor;
    }

    protected override async _registerListeners(): Promise<void> {

        /**
         * It should be a better idea to collect all the settings and options 
         * and register the editor related listeners when the browser-side 
         * lifecycle turns into ready state.
         */
        await this.lifecycleService.when(LifecyclePhase.Ready);

        // building options
        const explorerView = this.sideViewService.getView<IExplorerViewService>(ExplorerViewID);
        if (explorerView) {
            explorerView.onDidOpen((e) => {
                this._editorWidget?.updateOptions({ baseURI: URI.toFsPath(e.path) });
            });
        }
    }

    // [private helper methods]

}

registerSingleton(IEditorService, new ServiceDescriptor(Editor));