
export interface IResize {

}

// TODO: complete
export class Resize implements IResize {

    public id: string = 'resize';
    public element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');

    }

}