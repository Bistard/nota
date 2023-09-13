import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { IEditorWidgetOptions } from "src/editor_new/common/editorConfiguration";
import { IEditorModel } from "src/editor_new/common/model";

export class EditorModel extends Disposable implements IEditorModel {

    // [fields]

    private readonly _source: URI;

    /** The options of the entire editor. */
    private readonly _options: IEditorWidgetOptions;

    // [constructor]

    constructor(
        source: URI,
        options: IEditorWidgetOptions,
    ) {
        super();
        this._source = source;
        this._options = options;
    }

    // [public methods]

    // [private helper methods]
}