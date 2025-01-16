import 'src/workbench/parts/navigationPanel/navigationBar/toolBar/media/filterBar.scss';
import { Component, IComponent } from 'src/workbench/services/component/component';
import { Icons } from 'src/base/browser/icon/icons';
import { Button } from 'src/base/browser/basic/button/button';
import { createService, IService } from 'src/platform/instantiation/common/decorator';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';

export const IFilterBarService = createService<IFilterBarService>('filter-bar-service');

/**
 * An interface only for {@link FilterBar}.
 */
export interface IFilterBarService extends IComponent, IService {
    
}

export class FilterBar extends Component implements IFilterBarService {

    declare _serviceMarker: undefined;

    // [field]
    
    // [event]

    // [constructor]

    constructor(
        @IInstantiationService instantiationService: IInstantiationService,
    ) {
        super('filter-bar', null, instantiationService);
    }

    // [public method]

    // [protected override method]

    protected override __createContent(): void {
        const logo = this.__register(this.__createLogo()); // TODO: test, delete later
        this.element.appendChild(logo.element);
    }

    protected override __registerListeners(): void {
        
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
