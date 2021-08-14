import { IWidget } from "src/base/browser/ui/widget";

export interface IResize extends IWidget {

}

// TODO: complete
export class Resize implements IResize {

    public id: string = 'resize';
    public element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');

    }

}