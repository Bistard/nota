import { URI } from "src/base/common/file/uri";
import { IComponentService } from "src/code/browser/service/component/componentService";
import { IThemeService } from "src/code/browser/service/theme/themeService";
import { Component, IComponent } from "src/code/browser/service/component/component";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { ServiceDescriptor } from "src/code/platform/instantiation/common/descriptor";
import { IInstantiationService } from "src/code/platform/instantiation/common/instantiation";
import { registerSingleton } from "src/code/platform/instantiation/common/serviceCollection";
import { EditorWidget, IEditorWidget } from "src/editor/editorWidget";
import { EditorModel } from "src/editor/model/editorModel";
import { Mutable } from "src/base/common/util/type";

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
        const editor = this.instantiationService.createInstance(
            EditorWidget, 
            this.element.element,
            {},
        );

        (<Mutable<EditorWidget>>this._editorWidget) = editor;
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper methods]

}

registerSingleton(IEditorService, new ServiceDescriptor(Editor));