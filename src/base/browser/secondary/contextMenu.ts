import { Component } from "src/code/workbench/browser/component";
import { IRegisterService } from "src/code/workbench/service/registerService";

export interface IMenu {

}

export class contextMenu extends Component implements IMenu {

    constructor(id: string,
                parent: HTMLElement,
                registerService: IRegisterService) {
        super('context-menu', parent, registerService);

    }

    protected override _createContainer(): void {

    }

    protected override _createContentArea(): void {

    }

    protected override _registerListeners(): void {

    }

}