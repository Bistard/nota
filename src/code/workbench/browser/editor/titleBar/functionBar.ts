import { Button } from "src/base/browser/basic/button";
import { EVENT_EMITTER } from "src/base/common/event";
import { getSvgPathByName, SvgType } from "src/base/common/string";
import { ConfigModule } from "src/base/config";
import { domNodeByIdAddListener } from "src/base/electron/register";
import { Component } from "src/code/workbench/browser/component";
import { EditorComponentType } from "src/code/workbench/browser/editor/editor";
import { IRegisterService } from "src/code/workbench/service/registerService";

export class FunctionBarComponent extends Component {

    public static isfunctionBarExpand: boolean = false;
    public static isToolBarExpand: boolean = false;
    // public static isTabBarExpand: boolean = false;

    constructor(parent: HTMLElement,
                registerService: IRegisterService
    ) {
        super(EditorComponentType.functionBar, parent, registerService);
    }

    protected override _createContainer(): void {
        this.parent.appendChild(this.container);
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        this.contentArea = document.createElement('div');
        this.contentArea.id = 'function-bar-container';
        this.container.appendChild(this.contentArea);

        [
            {id: 'mode-switch', src: 'md-wysiwyg'},
            {id: 'md-tool', src: 'text'},
            {id: 'tabs', src: 'tabs'},
        ].forEach(({id, src}) => {
            const button = new Button(id, this.contentArea!);
            button.setClass(['button', 'function-button']);
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center', 'filter-black']);
        })
        
        const button = new Button('expand-collapse', this.container);
        button.setClass(['button']);
        button.setImage(getSvgPathByName(SvgType.base, 'caret-left'));
        button.setImageClass(['vertical-center', 'filter-black']);
    }

    protected override _registerListeners(): void {

        this.initfunctionBar();

        domNodeByIdAddListener('mode-switch', 'click', () => {
            EVENT_EMITTER.emit('EMarkdownModeSwitch');
        });

        domNodeByIdAddListener('md-tool', 'click', () => {
            this.mdToolStateChange(!FunctionBarComponent.isToolBarExpand);
        });
        
        domNodeByIdAddListener('expand-collapse', 'click', () => {
            this.functionBarStateChange(!FunctionBarComponent.isfunctionBarExpand);
        });
    }

    /**
     * @description function calls when the functionBarModule is initialized.
     */
     initfunctionBar(): void {
        if (ConfigModule.Instance.defaultMarkdownMode == 'wysiwyg') {
            $('#mode-switch').addClass('function-button-focus');
        }

        if (FunctionBarComponent.isfunctionBarExpand == false) {
            this.functionBarStateChange(false);
        }

        if (FunctionBarComponent.isToolBarExpand == false) {
            $('.toastui-editor-toolbar').first().hide(0);
        }
    }

    /**
     * @description change the state of view of markdown tool.
     */
    mdToolStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('.toastui-editor-toolbar').show(100);
            $('#md-tool').addClass('function-button-focus');
            FunctionBarComponent.isToolBarExpand = true;
        } else {
            $('.toastui-editor-toolbar').hide(100);
            $('#md-tool').removeClass('function-button-focus');
            FunctionBarComponent.isToolBarExpand = false;
        }
    }

    /**
     * @description change the state of view of functionBar.
     */
    functionBarStateChange(shouldExpand: boolean): void {
        if (shouldExpand) {
            $('#function-bar-container').show(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName(SvgType.base, 'caret-left'));
            FunctionBarComponent.isfunctionBarExpand = true;
        } else {
            $('#function-bar-container').hide(100);
            $('#expand-collapse > img').attr('src', getSvgPathByName(SvgType.base, 'caret-right'));
            FunctionBarComponent.isfunctionBarExpand = false;
        }
    }
    
}