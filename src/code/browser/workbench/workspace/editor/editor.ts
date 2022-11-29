import { URI } from "src/base/common/file/uri";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { Component, IComponent } from "src/code/browser/service/component/component";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { EditorWidget, IEditorWidget, IEditorWidgetOptions } from "src/editor/editorWidget";
import { Mutable } from "src/base/common/util/type";
import { EditorViewDisplayType } from "src/editor/common/view";
import { ISideViewService } from "src/code/browser/workbench/sideView/sideView";
import { ExplorerViewID, IExplorerViewService } from "src/code/browser/workbench/sideView/explorer/explorerService";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/code/platform/lifecycle/browser/browserLifecycleService";
import { ILogService } from "src/base/common/logger";

export const IEditorService = createService<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

    /**
     * @description Openning a source given the URI in the editor.
     * @param source The {@link URI} or an RUI in the string form.
     */
    openSource(source: URI | string): void;
}

export class Editor extends Component implements IEditorService {

    // [field]

    private readonly _editorWidget!: IEditorWidget;

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IFileService private readonly fileService: IFileService,
        @IThemeService themeService: IThemeService,
        @ISideViewService private readonly sideViewService: ISideViewService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @ILogService private readonly logService: ILogService,
    ) {
        super('editor', null, themeService, componentService);
    }

    // [public methods]

    public openSource(source: URI | string): void {
        
        if (!this._editorWidget) {
            throw new Error('editor service is currently not created');
        }
        
        let uri = source;
        if (!URI.isURI(uri)) {
            uri = URI.fromFile(<string>source);
        }
        
        this._editorWidget.open(uri);
    }

    // [override protected methods]

    protected override _createContent(): void {

        this.lifecycleService.when(LifecyclePhase.Ready).then(() => {
            
            // option base
            const options = <IEditorWidgetOptions>{
                display: EditorViewDisplayType.WYSIWYG,
                baseURI: undefined
            };

            // building options
            const explorerView = this.sideViewService.getView<IExplorerViewService>(ExplorerViewID);
            if (explorerView?.root) {
                options.baseURI = explorerView.root;
            }

            this.logService.trace(`Renderer#editorWidget#option#${options}`);

            // eidtor widget construction
            const editor = this.instantiationService.createInstance(EditorWidget, this.element.element, options);
            (<Mutable<EditorWidget>>this._editorWidget) = editor;
        });
    }

    protected override _registerListeners(): Promise<void> {

        /**
         * It should be better idea to collect all the settings and options and 
         * register the editor related listeners when the browser-side lifecycle 
         * turns into ready state.
         */

        return this.lifecycleService.when(LifecyclePhase.Ready).then(() => {
            
            // building options
            const explorerView = this.sideViewService.getView<IExplorerViewService>(ExplorerViewID);
            if (explorerView) {
                explorerView.onDidOpen((e) => {
                    this._editorWidget.updateOptions({ baseURI: e.path });
                });
            }
        });
    }

    // [private helper methods]

}

registerSingleton(IEditorService, new ServiceDescriptor(Editor));