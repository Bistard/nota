import 'src/workbench/parts/navigationPanel/navigationBar/media/toolBar.scss';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ToolButton } from 'src/workbench/parts/navigationPanel/navigationBar/toolBarButton';
import { ToolButtonType } from 'src/workbench/parts/navigationPanel/navigationBar/toolBar';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';

export class QuickAccessBar extends Component {

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
    ) {
        super('quick-access-bar', null, themeService, componentService);
    }

    public render(container: HTMLElement): void {
        this._createContent();
        container.appendChild(this.element.element);
    }

    // [protected override method]
    
    protected override _createContent(): void {
        const logo = this.__createLogo();
        this.element.appendChild(logo.element);
    }
    
    protected override _registerListeners(): void {
        
    }

    // [private helper method]
    
    private __createLogo(): ToolButton {
        const logo = new ToolButton({ id: ToolButtonType.LOGO, isPrimary: true, classes: ['logo'] });
        logo.render(document.createElement('div'));
        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);
        return logo;
    }
}
