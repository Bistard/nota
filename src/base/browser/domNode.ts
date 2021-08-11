
export class domNode<T extends HTMLElement> {

    public readonly node: T;

    constructor(domNode: T) {
        this.node = domNode;
    }

}