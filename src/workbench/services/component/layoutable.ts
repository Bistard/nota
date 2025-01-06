import { Themable } from "src/workbench/services/theme/theme";
import { Emitter, Event, Register } from "src/base/common/event";
import { addDisposableListener, DomUtility, EventType } from "src/base/browser/basic/dom";
import { Dimension, IDimension } from "src/base/common/utilities/size";
import { isNonNullable, nullable } from "src/base/common/utilities/type";
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IBrowserEnvironmentService } from "src/platform/environment/common/environment";
import { IHostService } from "src/platform/host/common/hostService";

/**
 * An interface only for {@link Layoutable}.
 */
export interface ILayoutable extends Themable {
    /**
     * The current dimension of the UI.
     */
    readonly dimension: Dimension | undefined;

    /** 
     * Fires the new dimension of the component when the component is re-layout(ing).
     */
    readonly onDidLayout: Register<IDimension>;

    /**
     * @description Layout the UI to the given dimension. This function only 
     * modifies the internal {@link dimension} attribute without directly 
     * changing the DOM tree.
     *
     * @param width The width of the dimension.
     * @param height The height of the dimension.
     * @param preventDefault If set to `true`, the {@link onDidLayout} event 
     *                       will not be triggered. Defaults to `false`.
     * @param mockDimension If provided, this dimension will be emitted instead 
     *                      of the actual one. Useful for mocking or testing.
     * @returns The new dimension of the UI after layout.
     *
     * @note This function does not update the actual DOM style or layout; it 
     *       only updates the {@link dimension} property.
     * @note If no dimensions are provided, the implementation attempts to fill 
     *       the dimension by measuring the element returned by {@link getLayoutElement}. 
     *       If that element is not present or not in the DOM tree, a default 
     *       empty dimension (width=0, height=0) may be used.
     * @note Will trigger the {@link onDidLayout} event unless `preventDefault` 
     *       is set to `true`.
     */
    layout(width?: number, height?: number, preventDefault?: boolean, mockDimension?: IDimension): IDimension;
    
    /**
     * @description Returns the primary DOM element that the layout logic should 
     * act upon (e.g., to measure or set its dimensions). If `null` or `undefined` 
     * is returned, layout will fall back to empty dimension (width=0, height=0).
     */
    getLayoutElement(): HTMLElement | nullable;

    /**
     * @description Registers listeners (e.g., window resize, fullscreen toggle) 
     * to automatically trigger the {@link layout} method. This helps keep the 
     * UI's dimensions up to date when the environment or browser window changes.
     */
    registerAutoLayout(): void;
}

/**
 * @class A base class dedicated to handle layout logic.
 */
export abstract class Layoutable extends Themable implements ILayoutable {

    // [field]

    private _dimension?: Dimension;

    private readonly _onDidLayout = this.__register(new Emitter<IDimension>());
    public readonly onDidLayout = this._onDidLayout.registerListener;

    // [constructor]

    constructor(
        protected readonly instantiationService: IInstantiationService,
    ) {
        const themeService = instantiationService.getOrCreateService(IThemeService);
        super(themeService);
    }

    // [getter]

    get dimension() { return this._dimension; }

    // [public methods]

    public abstract getLayoutElement(): HTMLElement | nullable;

    public layout(width?: number, height?: number, preventDefault?: boolean, mockDimension?: IDimension): IDimension {
        
        // If no dimensions provided, we default to layout to fit to parent.
        if (width === undefined && height === undefined) {
            const element = this.getLayoutElement();
            if (!element || !DomUtility.Elements.ifInDomTree(element)) {
                return (this._dimension = Dimension.None);
            } 
            this._dimension = DomUtility.Positions.getClientDimension(element);
        }
        // If any dimensions is provided, we force to follow it.
        else {
            this._dimension = isNonNullable(this._dimension)
                ? this._dimension.clone(width, height)
                : new Dimension(width ?? 0, height ?? 0);
        }

        if (preventDefault !== true) {
            this._onDidLayout.fire(mockDimension ?? this._dimension);
        }
        
        return this._dimension;
    }

    public registerAutoLayout(): void {
        this.__register(addDisposableListener(window, EventType.resize, () => {
            this.layout();
        }));

        const hostService = this.instantiationService.getOrCreateService(IHostService);
        const environmentService = this.instantiationService.getOrCreateService(IBrowserEnvironmentService);
        const anyEvents = Event.any([
            hostService.onDidEnterFullScreenWindow,
            hostService.onDidLeaveFullScreenWindow,
            hostService.onDidMaximizeWindow,
            hostService.onDidUnMaximizeWindow,
        ]);
        this.__register(anyEvents(windowID => {
            if (windowID === environmentService.windowID) {
                this.layout();
            }
        }));
    }

    protected override __updateStyles(): void { /** noop */ }
}
