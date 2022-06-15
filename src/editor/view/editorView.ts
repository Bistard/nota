import { FastElement } from "src/base/browser/basic/fastElement";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { IEditorView, IEditorViewComponent, IEditorViewContext } from "src/editor/common/view";
import { IEditorViewModel } from "src/editor/common/viewModel";
import { RenderMetadata } from "src/editor/view/component/viewComponent";
import { requestAtNextAnimationFrame } from "src/base/common/animation";
import { DomUtility } from "src/base/common/dom";
import { ViewLineWidget } from "src/editor/view/component/viewLineWidget";

export class EditorViewContext implements IEditorViewContext {

    constructor(
        public readonly viewModel: IEditorViewModel,
        public readonly theme: any,
        public readonly configuration: any,
    ) {}

}

/**
 * @class // TODO
 */
export class EditorView extends Disposable implements IEditorView {

    // [field]

    private readonly _element: FastElement<HTMLElement>;
    private _nextRenderFrame: IDisposable | null = null;
    
    private readonly _context: IEditorViewContext;
    
    // <section> - view components
    private readonly _viewComponents: Map<string, IEditorViewComponent>;
    private readonly _viewLineWidget: ViewLineWidget;
    // <section> - end

    // [event]

    // [constructor]

    constructor(
        container: HTMLElement,
        viewModel: IEditorViewModel,
    ) {
        super();

        this._element = new FastElement(document.createElement('div'));
        this._element.setClassName('editor-view');
        this._element.setAttribute('role', 'presentation');
        
        const context = new EditorViewContext(viewModel, undefined, undefined);
        this._context = context;
        this._viewComponents = new Map();

        this._viewLineWidget = new ViewLineWidget(context);
        this.__registerComponent(this._viewLineWidget);

        container.appendChild(this._element.element);
    }

    // [public methods]

    public render(now: boolean = false, everything: boolean = false): void {

        if (everything) {
            for (const [id, component] of this._viewComponents) {
                component.forceRender();
            }
        }

        if (now) {
            this.__doRender();
        } else {
            this.__requestRender();
        }
    }

    // [public override handle event methods]

    // [private helper methods]

    private __requestRender(): void {
        if (this._nextRenderFrame === null) {
            this._nextRenderFrame = requestAtNextAnimationFrame(() => this.__onRequestRender());
        }
    }

    private __onRequestRender(): void {
        this._nextRenderFrame?.dispose();
        this._nextRenderFrame = null;
        this.__doRender();
    }

    private __doRender(): void {
        
        if (DomUtility.ifInDomTree(this._element.element) === false) {
            return;
        }

        const shouldRender = this.__getShouldRenderComponents();
        if (shouldRender.length === 0) {
            return;
        }

        const metadata = new RenderMetadata(this._context);

        for (const [id, component] of this._viewComponents) {
            component.render(metadata);
            component.onDidRender();
        }

    }

    private __getShouldRenderComponents(): IEditorViewComponent[] {
        let shouldRender: IEditorViewComponent[] = [];
        for (const [id, component] of this._viewComponents) {
            if (component.shouldRender()) {
                shouldRender.push(component);
            }
        }
        return shouldRender;
    }

    private __registerComponent(component: IEditorViewComponent): void {
        this._viewComponents.set(component.id, component);
    }

}