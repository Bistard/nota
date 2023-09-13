import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/files/uri";
import { IEditorModel } from "src/editor_new/common/model";

export class EditorModel extends Disposable implements IEditorModel {

    // [fields]

    private readonly _source: URI;

    // [constructor]

    constructor(
        source: URI,
    ) {
        super();
        this._source = source;
    }

    // [public methods]

    // [private helper methods]
}