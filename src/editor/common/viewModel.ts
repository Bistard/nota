import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";

export interface IEditorViewModel extends Disposable {

    readonly onFlush: Register<string[]>;
}