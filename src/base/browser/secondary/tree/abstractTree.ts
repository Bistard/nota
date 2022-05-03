import { ITreeModel } from "./tree";


/**
 * @class An {@link AbstractTree} is the base class for any tree-like structure.
 * MVVM is used in these related classes. Built upon a model {@link ITreeModel}.
 */
export abstract class AbstractTree<T, TFilter> {

    // [fields]

    /** the raw data model of the tree. */
    private _model: ITreeModel<T, TFilter>;

    // [constructor]

    constructor() {

        this._model = this.createModel();

    }

    // [abstract methods]

    public abstract createModel(): ITreeModel<T, TFilter>;

    // [methods]

    public splice(): void {

    }

    // [private helper methods]

}