import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/filterBar.scss';
import { Component } from 'src/workbench/services/component/component';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { ILogService } from 'src/base/common/logger';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { createService, IService } from 'src/platform/instantiation/common/decorator';

export const IFilterBarService = createService<IFilterBarService>('tool-bar-service');

export interface IFilterBarService extends IComponentService, IService {
    
}

export class FilterBar extends Component {

    // [filed]
    
    // [event]

    // [constructor]

    constructor(
        @IComponentService componentService: IComponentService,
        @IThemeService themeService: IThemeService,
        @ILogService logService: ILogService,
    ) {
        super('filter-bar', null, themeService, componentService, logService);
    }

    // [public method]

    // [protected override method]

    protected override _createContent(): void {
        const logo = this.__createLogo(); // TODO: test, delete later
        this.element.appendChild(logo.element);
    }

    protected override _registerListeners(): void {
        
    }

    // [private method]

    // TODO: test, delete later
    private __createLogo(): Button {
        const logo = new Button({ id: Icons.FolderDefault, classes: ['logo'] });
        logo.render(document.createElement('div'));
        
        const text = document.createElement('div');
        text.innerText = 'N';
        logo.element.appendChild(text);
        
        return logo;
    }
}
