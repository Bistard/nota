import { MarkdownRenderMode } from 'mdnote';
import { ConfigModule } from 'src/base/config';
import { MarkdownComponent } from 'src/code/workbench/browser/editor/markdown/markdown';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { getSvgPathByName } from 'src/base/common/string';
import { Button } from 'src/base/browser/ui/button';
import { TabBarComponent } from 'src/code/workbench/browser/editor/titleBar/tabBar';
import { WindowBarComponent } from 'src/code/workbench/browser/editor/titleBar/windowBar';

/**
 * @description TitleBarComponent stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    toolBarView!: HTMLElement;
    
    // toolBarComponent!: ToolBarComponent:
    tabBarComponent!: TabBarComponent;
    windowBarComponent!: WindowBarComponent;

    markdownMode: MarkdownRenderMode;

    isToolBarExpand: boolean;
    isMarkdownToolExpand: boolean;
    isTabBarExpand: boolean;

    constructor(registerService: IRegisterService) {
        super('title-bar-container', registerService);

        // this.Markdown = MarkdownComponent;

        this.markdownMode = ConfigModule.defaultMarkdownMode;

        this.isToolBarExpand = ConfigModule.isToolBarExpand;
        this.isMarkdownToolExpand = false;
        this.isTabBarExpand = false;

        this.initToolBar();
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        // customize..
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        
        // tool-bar
        this.toolBarView = document.createElement('div');
        this.toolBarView.id = 'tool-bar';

        const toolBarContainer = document.createElement('div');
        toolBarContainer.id = 'tool-bar-container';
        
        this._createToolBar(toolBarContainer);
        this.toolBarView.appendChild(toolBarContainer);
        this.container.appendChild(this.toolBarView);

        // tab-bar
        this._createTabBar(this.container);

        // window-bar
        this._createWindowBar(this.container);
        
    }

    protected override _registerListeners(): void {
        
        // component registration
        this.tabBarComponent.registerListeners();
        this.windowBarComponent.registerListeners();
        
        domNodeByIdAddListener('mode-switch', 'click', () => {
            this.markdownModeSwitch(this.markdownMode);
        });

        domNodeByIdAddListener('md-tool', 'click', () => {
            this.mdToolStateChange(!this.isMarkdownToolExpand);
        });
        
        domNodeByIdAddListener('expand-collapse', 'click', () => {
            this.toolBarStateChange(!this.isToolBarExpand);
        });
        
    }

    private _createToolBar(parent: HTMLElement): void {
        
        [
            {id: 'mode-switch', src: 'md-wysiwyg'},
            {id: 'md-tool', src: 'text'},
            {id: 'tabs', src: 'tabs'},
        ].forEach(({id, src}) => {
            const button = new Button(id, parent);
            button.setClass('button', 'tool-button');
            button.setImage(src);
            button.setImageClass('vertical-center', 'filter-black');
        })
        
        const button = new Button('expand-collapse', this.toolBarView);
        button.setClass('button');
        button.setImage('caret-left');
        button.setImageClass('vertical-center', 'filter-black');
    }

    private _createTabBar(parent: HTMLElement): void {
        this.tabBarComponent = new TabBarComponent(this);
        this.tabBarComponent.create(parent);
    }

    private _createWindowBar(parent: HTMLElement): void {
        this.windowBarComponent = new WindowBarComponent(this);
        this.windowBarComponent.create(parent);
    }
    
    /**
     * @description function calls when the ToolBarModule is initialized.
     */
     initToolBar(): void {
        if (this.markdownMode == 'wysiwyg') {
            $('#mode-switch').addClass('tool-button-focus');
        }

        if (this.isToolBarExpand == false) {
            this.toolBarStateChange(false);
        }

        if (this.isMarkdownToolExpand == false) {
            $('.toastui-editor-toolbar').first().hide(0);
        }
    }

    /**
     * @description change the mode of markdown renderering method. They are 
     * 'wysiwyg', 'instant' and 'split'.
     */
     markdownModeSwitch(mode: MarkdownRenderMode): void {
        if (mode == 'wysiwyg') {
            $('#mode-switch').removeClass('tool-button-focus');
            $('#mode-switch > img').attr('src', getSvgPathByName('md-split'));
            // this.Markdown.editor!.changeMode('markdown', true);
            this.markdownMode = 'split';
        } else if (mode == 'instant') {
            // TODO: complete instant-mode (big update)
        } else { // (mode == 'split')
            $('#mode-switch').addClass('tool-button-focus');
            $('#mode-switch > img').attr('src', getSvgPathByName('md-wysiwyg'));
            // this.Markdown.editor!.changeMode('wysiwyg', true);
            this.markdownMode = 'wysiwyg';
        }
    }

    /**
     * @description change the state of view of markdown tool.
     */
    mdToolStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('.toastui-editor-toolbar').show(100);
            $('#md-tool').addClass('tool-button-focus');
            this.isMarkdownToolExpand = true;
        } else {
            $('.toastui-editor-toolbar').hide(100);
            $('#md-tool').removeClass('tool-button-focus');
            this.isMarkdownToolExpand = false;
        }
    }

    /**
     * @description change the state of view of toolBar.
     */
     toolBarStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('#tool-bar-container').show(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName('caret-left'));
            this.isToolBarExpand = true;
        } else {
            $('#tool-bar-container').hide(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName('caret-right'));
            this.isToolBarExpand = false;
        }
    }

}
