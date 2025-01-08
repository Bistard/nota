import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/actionBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { WidgetBar } from 'src/base/browser/secondary/widgetBar/widgetBar';
import { Emitter, Register } from 'src/base/common/event';
import { Orientation } from 'src/base/browser/basic/dom';
import { Button, IButtonOptions } from 'src/base/browser/basic/button/button';
import { createService, IService } from 'src/platform/instantiation/common/decorator';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export const IActionBarService = createService<IActionBarService>('action-bar-service');

export interface IActionBarClickEvent {
    readonly prevButtonID: string | null;
    readonly currButtonID: string;
}

/**
 * An interface only for {@link ActionBar}.
 */
export interface IActionBarService extends IComponent, IService {
    /**
     * Fires when any heading is clicked from the view.
     */
    readonly onDidClick: Register<IActionBarClickEvent>;

    /**
     * @description Register icon buttons for Action Bar.
     * @param opts Button options
     */
    registerButton(opts: IButtonOptions): boolean;
}

export class ActionBar extends Component implements IActionBarService {

    declare _serviceMarker: undefined;

    // [field]

    public static readonly HEIGHT = 60;

    private _currActiveButton: string | null;
    private readonly _buttonBar: WidgetBar<Button>;
    
    // [event]
    
    private readonly _onDidClick = new Emitter<IActionBarClickEvent>();
    public readonly onDidClick = this._onDidClick.registerListener;

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('action-bar', null, instantiationService);
        this._buttonBar = new WidgetBar('action-bar-buttons', { orientation: Orientation.Horizontal });

        this._currActiveButton = null;
    }

    // [public method]

    public getButton(ID: string): Button | undefined {
        return this._buttonBar.getItem(ID);
    }

    public registerButton(opts: IButtonOptions): boolean {
        return this.__registerButton(opts, this._buttonBar);
    }

    public clickButton(buttonID: string): void {
        const clickedButton = this.getButton(buttonID);
        if (!clickedButton) {
            return;
        }

        // Deactivate the previously active button
        if (this._currActiveButton) {
            const prevButton = this.getButton(this._currActiveButton);
            if (prevButton) {
                prevButton.element.classList.remove('activated');
            }
        }

        // Activate the clicked button
        clickedButton.element.classList.add('activated');
        const prevButtonID = this._currActiveButton;
        this._currActiveButton = buttonID;

        // Fire the click event
        this._onDidClick.fire({
            prevButtonID: prevButtonID,
            currButtonID: buttonID,
        });
    }
    
    // [protected override method]

    protected override __createContent(): void {
        this._buttonBar.render(this.element.raw);
        this.__register(this._buttonBar);
    }

    protected override __registerListeners(): void {

    }

    // [private method]
    private __registerButton(opts: IButtonOptions, widgetBar: WidgetBar<Button>): boolean {
        
        // validation
        if (widgetBar.hasItem(opts.id)) {
            this.logService.warn('ActionBarService', `Cannot register the action bar button with duplicate ID.`, { ID: opts.id });
            return false;
        }

        // button creation
        const button = new Button(opts);
        widgetBar.addItem({
            id: opts.id,
            data: button,
            disposable: button,
        });
        
        // register listener
        this.__register(button.onDidClick(() => {
            this.clickButton(button.id);
        }));

        return true;
    }
}