import 'src/workbench/parts/workspace/tabBar/media/editorTabView.scss';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { Disposable } from 'src/base/common/dispose';
import { EditorPaneModel } from 'src/workbench/services/editorPane/editorPaneModel';

/**
 * This interface is only for {@link EditorTabView}.
 */
export interface IEditorTabView extends Disposable {
    
    openEditor(model: EditorPaneModel): Promise<void>;
}

/**
 * Structure:
 *     +====================================+
 *     |   Tab 1   |   Tab 2   |   Tab 3    |
 *     +====================================+
 */
export class EditorTabView extends Disposable implements IEditorTabView {

    // [fields]

    public static readonly TAB_BAR_HEIGHT = 29;
    private readonly _container: HTMLElement;

    // [constructor]

    constructor(
        parent: HTMLElement,
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super();
        this._container = document.createElement('div');
        this._container.className = 'editor-tab-view';
        this._container.style.setProperty('--nota-tab-view-height', `${EditorTabView.TAB_BAR_HEIGHT}px`);

        // TODO: detailed rendering

        parent.appendChild(this._container);
    }

    // [public method]

    public async openEditor(model: EditorPaneModel): Promise<void> {
        // TODO
    }
}
