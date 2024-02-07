import { Disposable } from "src/base/common/dispose";
import { IService } from "src/platform/instantiation/common/decorator";


export interface ICodeInspectorService extends IService {

}

export class CodeInspectorService extends Disposable implements ICodeInspectorService {

    // [fields]

    declare _serviceMarker: undefined;

    // [constructor]

    constructor() {
        super();        
    }
}