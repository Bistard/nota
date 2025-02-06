/**
 * This file is used to solve circular dependency.
 */

import type { Constructor } from "src/base/common/utilities/type";
import { IService } from "src/platform/instantiation/common/decorator";
import { EditorPaneView } from "src/workbench/services/editorPane/editorPaneView";

export class EditorPaneDescriptor<TServices extends IService[] = any[]> {

    constructor(
        public readonly ctor: Constructor<EditorPaneView, [...services: TServices]>
    ) { }
}
