import { Button } from "src/base/browser/basic/button";
import { EVENT_EMITTER } from "src/base/common/event";
import { getSvgPathByName } from "src/base/common/string";
import { ConfigModule } from "src/base/config";
import { domNodeByIdAddListener } from "src/base/electron/register";
import { Component } from "src/code/workbench/browser/component";
import { EditorComponentType } from "src/code/workbench/browser/editor/editor";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class ToolBarComponent extends Component {

    public static isToolBarExpand: boolean = true;
    public static isMarkdownToolExpand: boolean = false;
    public static isTabBarExpand: boolean = false;

    constructor(parent: HTMLElement,
                registerService: IRegisterService
    ) {
        super(EditorComponentType.toolBar, parent, registerService);
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
            EVENT_EMITTER.emit('EMarkdownModeSwitch');
        });

        domNodeByIdAddListener('md-tool', 'click', () => {
            this.mdToolStateChange(!ToolBarComponent.isMarkdownToolExpand);
        });
        
        domNodeByIdAddListener('expand-collapse', 'click', () => {
            this.toolBarStateChange(!ToolBarComponent.isToolBarExpand);
        });
    }

    /**
     * @description function calls when the ToolBarModule is initialized.
     */
     initToolBar(): void {
        if (ConfigModule.Instance.defaultMarkdownMode == 'wysiwyg') {
            $('#mode-switch').addClass('tool-button-focus');
        }

        if (ToolBarComponent.isToolBarExpand == false) {
            this.toolBarStateChange(false);
        }

        if (ToolBarComponent.isMarkdownToolExpand == false) {
            $('.toastui-editor-toolbar').first().hide(0);
        }
    }

    /**
     * @description change the state of view of markdown tool.
     */
    mdToolStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('.toastui-editor-toolbar').show(100);
            $('#md-tool').addClass('tool-button-focus');
            ToolBarComponent.isMarkdownToolExpand = true;
        } else {
            $('.toastui-editor-toolbar').hide(100);
            $('#md-tool').removeClass('tool-button-focus');
            ToolBarComponent.isMarkdownToolExpand = false;
        }
    }

    /**
     * @description change the state of view of toolBar.
     */
    toolBarStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('#tool-bar-container').show(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName('caret-left'));
            ToolBarComponent.isToolBarExpand = true;
        } else {
            $('#tool-bar-container').hide(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName('caret-right'));
            ToolBarComponent.isToolBarExpand = false;
        }
    }
    
}