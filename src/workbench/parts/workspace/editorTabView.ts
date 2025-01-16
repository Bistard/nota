import 'src/workbench/parts/workspace/editorTabView.scss';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { Disposable } from 'src/base/common/dispose';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';
import { IBrowserEnvironmentService } from 'src/platform/environment/common/environment';
import { IReadonlyEditorGroupModel } from 'src/workbench/parts/workspace/editorGroupModel';

/**
 * This interface is only for {@link EditorTabView}.
 */
export interface IEditorTabView extends Disposable {
    
    /**
     * The rendering height in pixel of the entire tab view.
     */
    readonly height: number;
    openEditor(model: EditorPaneModel): Promise<void>;
}

/**
 * Structure:
 *     +------------------------------------+
 *     |   Tab 1   |   Tab 2   |   Tab 3    |
 *     +------------------------------------+
 */
export class EditorTabView extends Disposable implements IEditorTabView {

    // [fields]

    public readonly height: number;
    private readonly _container: HTMLElement;

    // [constructor]

    constructor(
        parent: HTMLElement,
        groupModel: IReadonlyEditorGroupModel,
        @IInstantiationService instantiationService: IInstantiationService,
        @IBrowserEnvironmentService environmentService: IBrowserEnvironmentService,
    ) {
        super();
        this.height = environmentService.configuration.titleBarHeight;

        this._container = document.createElement('div');
        this._container.className = 'editor-tab-view';
        this._container.style.setProperty('--nota-tab-view-height', `${this.height}px`);

        // TODO: actual rendering

        parent.appendChild(this._container);
    }

    // [public method]

    public async openEditor(model: EditorPaneModel): Promise<void> {
        // TODO
    }
}
