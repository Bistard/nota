import { IComponentService } from "src/code/browser/service/componentService";
import { Component, IComponent } from "src/code/browser/workbench/component";
import { WorkspaceComponentType } from "src/code/browser/workbench/workspace/workspace";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";
import { ServiceDescriptor } from "src/code/common/service/instantiationService/descriptor";
import { registerSingleton } from "src/code/common/service/instantiationService/serviceCollection";

export const IEditorService = createDecorator<IEditorService>('editor-service');

export interface IEditorService extends IComponent {

}

export class EditorComponent extends Component implements IEditorService {

    // [field]

    // [constructor]

    constructor(
        parentComponent: Component,
        @IComponentService componentService: IComponentService,
    ) {
        super(WorkspaceComponentType.editor, parentComponent, null, componentService);
    }

    // [public methods]

    // [override protected methods]

    protected override _createContent(): void {
        
    }

    protected override _registerListeners(): void {
        
    }

    // [private helper methods]

}

registerSingleton(IEditorService, new ServiceDescriptor(EditorComponent));