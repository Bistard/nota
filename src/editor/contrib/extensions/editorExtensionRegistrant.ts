import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";
import { IEditorExtensionCtor } from "src/editor/contrib/extensions/editorExtension";

export const IEditorExtensionRegistrant = createRegistrant<IEditorExtensionRegistrant>(RegistrantType.EditorExtension);

/**
 * An interface only for {@link EditorExtensionRegistrant}.
 */
export interface IEditorExtensionRegistrant {
    
    /**
     * @description Register an editor extension.
     * @param ID The identifier of the extension.
     * @param ctor The constructor of the extension.
     */
    registerEditorExtension(ID: string, ctor: IEditorExtensionCtor): void;

    /**
     * @description Gets all the registered editor extensions.
     */
    getEditorExtensions(): IEditorExtensionDescriptor[];
}

@IEditorExtensionRegistrant
class EditorExtensionRegistrant {

    // [field]

    private readonly _descriptors: IEditorExtensionDescriptor[];    

    // [constructor]

    constructor() {
        this._descriptors = [];
    }

    // [public methods]

    public registerEditorExtension(ID: string, ctor: IEditorExtensionCtor): void {
        this._descriptors.push({ ID, ctor });
    }

    public getEditorExtensions(): IEditorExtensionDescriptor[] {
        return this._descriptors.slice(0);
    }
}

export interface IEditorExtensionDescriptor {

    /**
     * The ID of the extension.
     */
    readonly ID: string;

    /**
     * Type of constructor of the extension.
     */
    readonly ctor: IEditorExtensionCtor;
}