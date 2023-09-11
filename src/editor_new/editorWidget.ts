import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import CKEditor from "@ckeditor/ckeditor5-build-classic";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

/**
 * An interface only for {@link EditorWidget}.
 */
export interface IEditorWidget extends Disposable {

    /**
     * @description Opens the source file in the editor. It will read the file
     * asynchronously.
     * @param source The source in URI form.
     */
    open(source: URI): Promise<void>;
}

/**
 * @class // TODO
 */
export class EditorWidget extends Disposable implements IEditorWidget {

    // [fields]

    private readonly _container: HTMLElement;
    private readonly _options: IEditorWidgetOptions;

    // [constructor]

    constructor(
        container: HTMLElement,
        opts: IEditorWidgetOptions,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
    ) {
        super();
        this._container = container;
        this._options = opts;
    }

    // [public methods]

    public async open(source: URI): Promise<void> {
        console.log('open invoked');
        

        await CKEditor.create(this._container, {
            language: 'en',
        });
    }

    // [private helper methods]
}