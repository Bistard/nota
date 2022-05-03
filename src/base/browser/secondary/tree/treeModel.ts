import { ITreeModel, ITreeNode, TreeNodeVisibility } from "./tree";

export class TreeModel<T, TFilter = void> implements ITreeModel<T, TFilter, number[]> {

    // [fields]

    private _root: ITreeNode<T, TFilter>;

    // [constructor]

    constructor() {
        
        this._root = {
            data: null,
            parent: null,
            children: [],
            depth: 0,
            visibility: TreeNodeVisibility.Hidden,
            collapsible: true,
            collapsed: false,
        };

    }

    // [methods]

    // [private helper methods]


}