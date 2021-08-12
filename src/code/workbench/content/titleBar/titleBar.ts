import { ConfigModule } from 'src/base/config';
import { MarkdownModule } from 'src/code/workbench/content/markdown/markdown';
import { MarkdownRenderMode } from 'mdnote';
import { domNodeByIdAddListener, ipcRendererOn, ipcRendererSend } from 'src/base/ipc/register';

/**
 * @description TitleBarModule stores and handles all the titleBar and toolBar 
 * relevant business. 
 */
export class TitleBarModule {
    
    Config: ConfigModule;
    Markdown: MarkdownModule;

    markdownMode: MarkdownRenderMode;

    isToolBarExpand: boolean;
    isMarkdownToolExpand: boolean;
    isTabBarExpand: boolean;

    constructor(ConfigModule: ConfigModule, MarkdownModule: MarkdownModule) {
        
        this.Config = ConfigModule;
        this.Markdown = MarkdownModule;

        this.markdownMode = this.Config.defaultMarkdownMode;
        
        this.isToolBarExpand = this.Config.isToolBarExpand;
        this.isMarkdownToolExpand = false;
        this.isTabBarExpand = false;

        this.initToolBar();
        this.setListeners();
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
            $('#mode-switch > img').attr('src', './src/assets/svg/titleBarView/md-split.svg');
            this.Markdown.editor!.changeMode('markdown', true);
            this.markdownMode = 'split';
        } else if (mode == 'instant') {
            // TODO: complete instant-mode (big update)
        } else { // (mode == 'split')
            $('#mode-switch').addClass('tool-button-focus');
            $('#mode-switch > img').attr('src', './src/assets/svg/titleBarView/md-wysiwyg.svg');
            this.Markdown.editor!.changeMode('wysiwyg', true);
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
            $('#tool-bar').show(100);
            $('#expand-collapse > img').attr('src', './src/assets/svg/titleBarView/caret-left.svg');
            this.isToolBarExpand = true;
        } else {
            $('#tool-bar').hide(100);
            $('#expand-collapse > img').attr('src', './src/assets/svg/titleBarView/caret-right.svg');
            this.isToolBarExpand = false;
        }
    }

    /**
     * @description handling .svg of maxResButton
     */
    changeMaxResBtn(isMaxApp: boolean): void {
        const maxBtnImg = document.getElementById('maxBtnImg') as HTMLImageElement;
        if (isMaxApp) {
            maxBtnImg.src='./src/assets/svg/titleBarView/max-restore.svg';
        } else {
            maxBtnImg.src='./src/assets/svg/titleBarView/max.svg';
        }
    }

    /**
     * @description mianly setting up button listeners for the titleBar and 
     * toolBar.
     */
    setListeners(): void {
        
        domNodeByIdAddListener('mode-switch', 'click', () => {
            this.markdownModeSwitch(this.markdownMode);
        });

        domNodeByIdAddListener('md-tool', 'click', () => {
            this.mdToolStateChange(!this.isMarkdownToolExpand);
        });
        
        domNodeByIdAddListener('expand-collapse', 'click', () => {
            this.toolBarStateChange(!this.isToolBarExpand);
        });
        
        domNodeByIdAddListener('minBtn', 'click', () => {
            ipcRendererSend('minApp');
        });
        
        domNodeByIdAddListener('maxBtn', 'click', () => {
            ipcRendererSend('maxResApp');
        });
        
        domNodeByIdAddListener('closeBtn', 'click', () => {
            ipcRendererSend('closeApp');
        });
        
        ipcRendererOn('isMaximized', () => { 
            this.changeMaxResBtn(true);
        })

        ipcRendererOn('isRestored', () => { 
            this.changeMaxResBtn(false); 
        })
        
    }
}
