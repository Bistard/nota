import { MarkdownRenderMode } from "mdnote";
import { Button } from "src/base/browser/basic/button";
import { getSvgPathByName } from "src/base/common/string";
import { ConfigModule } from "src/base/config";
import { domNodeByIdAddListener } from "src/base/ipc/register";
import { Component } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class ToolBarComponent extends Component {

    markdownMode: MarkdownRenderMode;

    isToolBarExpand: boolean;
    isMarkdownToolExpand: boolean;
    isTabBarExpand: boolean;

    constructor(registerService: IRegisterService) {
        super('tool-bar', registerService);

        this.markdownMode = ConfigModule.defaultMarkdownMode;

        this.isToolBarExpand = ConfigModule.isToolBarExpand;
        this.isMarkdownToolExpand = false;
        this.isTabBarExpand = false;

    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'tool-bar-container';
        this.container.appendChild(this.contentArea);

        [
            {id: 'mode-switch', src: 'md-wysiwyg'},
            {id: 'md-tool', src: 'text'},
            {id: 'tabs', src: 'tabs'},
        ].forEach(({id, src}) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'tool-button']);
            button.setImage(src);
            button.setImageClass('vertical-center', 'filter-black');
        })
        
        const button = new Button('expand-collapse', this.container);
        button.setClass(['button']);
        button.setImage('caret-left');
        button.setImageClass('vertical-center', 'filter-black');
    }

    protected override _registerListeners(): void {

        this.initToolBar();

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