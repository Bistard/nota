import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/toolBar.scss';
import { IService, createService } from 'src/platform/instantiation/common/decorator';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { Emitter, Register } from 'src/base/common/event';
import { IActionBarService } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar/actionBar';
import { IFilterBarService } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar/filterBar';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export const IToolBarService = createService<IToolBarService>('tool-bar-service');

export const enum ToolBarType {
    Action,
    Filter
}

/**
 * An interface only for {@link ToolBar}.
 */
export interface IToolBarService extends IComponent, IService {
    
    /**
     * An event fired when the toolbar state changes between action and
     * filter modes.
     */
    readonly onDidStateChange: Register<ToolBarType>;

    /**
     * Switches the toolbar state to the specified type.
     * 
     * @param type - The toolbar type to switch to (`ToolBarType.Action` 
     * or `ToolBarType.Filter`).
     */
    switchTo(type: ToolBarType): void;
}

export class ToolBar extends Component implements IToolBarService {

    declare _serviceMarker: undefined;
    
    // [field]

    public static readonly HEIGHT = 60;

    private _currentState: ToolBarType;

    // [event]

    private readonly _onDidStateChange = this.__register(new Emitter<ToolBarType>());
    public readonly onDidStateChange = this._onDidStateChange.registerListener;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
        @IActionBarService private readonly actionBarService: IActionBarService,
        @IFilterBarService private readonly filterBarService: IFilterBarService,
    ) {
        super("tool-bar", null, instantiationService);
        this._currentState = ToolBarType.Action;
    }

    // [public]

    public switchTo(barType: ToolBarType): void {
        switch (barType) {
            case ToolBarType.Action:
                this.filterBarService.setVisible(false);
                this.actionBarService.setVisible(true);
                break;
            case ToolBarType.Filter:
                this.filterBarService.setVisible(true);
                this.actionBarService.setVisible(false);
                break;
        }

        this._currentState = barType;
        this._onDidStateChange.fire(this._currentState);
    }

    // [protected]

    protected override __createContent(): void {
        this.actionBarService.create(this);
        this.filterBarService.create(this);
        this.switchTo(ToolBarType.Action);
    }

    protected override __registerListeners(): void {
        // Can add more listeners if needed
    }
}
