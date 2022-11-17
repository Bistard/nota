import { Disposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ProseNode } from "src/editor/common/prose";

export interface IEditorViewModel extends Disposable {

    readonly onFlush: Register<ProseNode>;
}