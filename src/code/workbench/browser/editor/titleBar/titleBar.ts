import { MarkdownRenderMode } from 'mdnote';
import { ConfigModule } from 'src/base/config';
import { MarkdownComponent } from 'src/code/workbench/browser/editor/markdown/markdown';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';
import { Component } from 'src/code/workbench/browser/component';
import { IRegisterService } from 'src/code/workbench/service/registerService';
import { getSvgPathByName } from 'src/base/common/string';
import { Button } from 'src/base/browser/ui/button';

/**
 * @description TitleBarComponent stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
export class TitleBarComponent extends Component {
    
    // Markdown: MarkdownComponent;
    toolBarView!: HTMLElement;

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
        
        // tab-bar

        // title

        this.toolBarView.appendChild(toolBarContainer);
        this.container.appendChild(this.toolBarView);
    }

    protected override _registerListeners(): void {
        
        domNodeByIdAddListener('mode-switch', 'click', () => {
            this.markdownModeSwitch(this.markdownMode);
        });

        domNodeByIdAddListener('md-tool', 'click', () => {
            this.mdToolStateChange(!this.isMarkdownToolExpand);
        });
        
        domNodeByIdAddListener('expand-collapse', 'click', () => {
            this.toolBarStateChange(!this.isToolBarExpand);
        });
        
        domNodeByIdAddListener('min-btn', 'click', () => {
            ipcRendererSend('minApp');
        });
        
        domNodeByIdAddListener('max-btn', 'click', () => {
            ipcRendererSend('maxResApp');
        });
        
        domNodeByIdAddListener('close-btn', 'click', () => {
            ipcRendererSend('closeApp');
        });
        
        ipcRendererOn('isMaximized', () => { 
            this.changeMaxResBtn(true);
        })

        ipcRendererOn('isRestored', () => { 
            this.changeMaxResBtn(false); 
        })
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

    /**
     * @description handling .svg of maxResButton
     */
    changeMaxResBtn(isMaxApp: boolean): void {
        const maxBtnImg = document.getElementById('maxBtnImg') as HTMLImageElement;
        if (isMaxApp) {
            maxBtnImg.src='./src/assets/svg/max-restore.svg';
        } else {
            maxBtnImg.src='./src/assets/svg/max.svg';
        }
    }

}
