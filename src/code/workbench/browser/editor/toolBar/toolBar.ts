import { Button } from "src/base/browser/basic/button";
import { getSvgPathByName, SvgType } from "src/base/common/string";
import { Component } from "src/code/workbench/browser/component";
import { EditorComponentType } from "src/code/workbench/browser/editor/editor";
import { IRegisterService } from "src/code/workbench/service/registerService";

export enum ToolBarButtonType {
    HEADER = 'header',
    BOLD = 'bold',
    ITALIC = 'italic',
    TEXT_COLOR = 'textColor',
    STRIKE = 'strike',
    LINE = 'line',
    QUOTE = 'quote',
    UNORDERED_LIST = 'unorderedList',
    LIST = 'list',
    TASK = 'task',
    TABLE = 'table',
    CODE = 'code',
    CODE_BLOCK = 'codeBlock',
}

export class ToolBarComponent extends Component {

    toolBarContainer!: HTMLElement;
    toolBarInnerContainer!: HTMLElement;

    constructor(parent: HTMLElement,
                registerService: IRegisterService
    ) {
        super(EditorComponentType.toolBar, parent, registerService);
    }

    protected override _createContainer(): void {
        this.toolBarContainer = document.createElement('div');
        this.toolBarContainer.id = 'tool-bar-container';

        this.toolBarInnerContainer = document.createElement('div');
        this.toolBarInnerContainer.id = 'tool-bar-inner-container';

        this.toolBarContainer.appendChild(this.toolBarInnerContainer);
        this.container.appendChild(this.toolBarContainer);
        this._createContentArea();
    }

    protected override _createContentArea(): void {
        [
            {id: ToolBarButtonType.HEADER, src: 'text'},
            {id: ToolBarButtonType.BOLD, src: 'text'},
            {id: ToolBarButtonType.ITALIC, src: 'text'},
        ]
        .forEach(({id, src}) => {
            const button = new Button(id, this.toolBarInnerContainer);
            button.setClass(['button', 'tool-button']);
            button.setImage(getSvgPathByName(SvgType.base, src));
            button.setImageClass(['vertical-center', 'filter-black']);
        });
    }

    protected override _registerListeners(): void {

    }

}