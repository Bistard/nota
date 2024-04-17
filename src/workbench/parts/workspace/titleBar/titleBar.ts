import 'src/workbench/parts/workspace/titleBar/media/titleBar.scss';
import { Component } from 'src/workbench/services/component/component';
import { WindowBar } from 'src/workbench/parts/workspace/titleBar/windowBar';
import { IComponentService } from 'src/workbench/services/component/componentService';
import { IInstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IThemeService } from 'src/workbench/services/theme/themeService';
import { IProductService } from 'src/platform/product/common/productService';
import { ILogService } from 'src/base/common/logger';

/**
 * @class TitleBar stores and handles all the titleBar and functionBar 
 * relevant business. 
 */
export class TitleBar extends Component {

    private windowBar!: WindowBar;

    constructor(
        @IComponentService componentService: IComponentService,
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IThemeService themeService: IThemeService,
        @IProductService private readonly productService: IProductService,
        @ILogService logService: ILogService,
    ) {
        super('title-bar', null, themeService, componentService, logService);
    }

    protected override _createContent(): void {
        // window bar
        this.windowBar = this.instantiationService.createInstance(WindowBar);
        this.windowBar.create(this);
    }

    protected override _registerListeners(): void {

        // component registration
        this.windowBar.registerListeners();
    }

    // [private helper methods]
}
