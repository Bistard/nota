import type { Constructor, Pair } from "src/base/common/utilities/type";
import { EditorPaneView } from "src/workbench/services/editorPane/editorPaneView";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { EditorPaneModel } from "src/workbench/services/editorPane/editorPaneModel";
import { IRegistrant, RegistrantType } from "src/platform/registrant/common/registrant";
import { registerRichTextEditor } from "src/workbench/contrib/richTextEditor/editorPane.register";
import { IService } from "src/platform/instantiation/common/decorator";

/**
 * {@link IEditorPaneRegistrant} is a central part of the editor pane system, 
 * acting as a registry for associating:
 * - {@link EditorPaneView} with their corresponding 
 * - {@link EditorPaneModel}s. 
 * 
 * ## Architecture
 * - {@link EditorPaneView}: The UI layer of an editor, responsible for rendering content.
 * - {@link EditorPaneModel}: The data layer of an editor, providing content and context.
 * - {@link IEditorPaneRegistrant}: Acts as the registry, maintaining mappings between views and models.
 * 
 * This design allows dynamic matching of models to views. Each view may handle 
 * one or more models. 
 * 
 * ## Example
 * For instance, {@link TextEditorPaneModel} is designed to contain data for 
 * opening any text-related files. This can be associated with different views 
 * to open.
 */
export interface IEditorPaneRegistrant extends IRegistrant<RegistrantType.EditorPane> {

    /**
     * @description Registers a pair of an editor view constructor and its 
     * associated model constructors.
     * 
     * @param viewCtor The constructor of the editor view.
     * @param modelCtors An array of model constructors that can be handled by the given view.
     */
    registerEditor(viewCtor: EditorPaneDescriptor, modelCtors: Constructor<EditorPaneModel>[]): void;
    /**
     * @description Matches an editor model to an appropriate editor view 
     * constructor.
     *
     * @param model An instance of `EditorPaneModel` to match.
     * @returns The constructor of a matching `EditorPaneView`, or `undefined` 
     *          if no match is found.
     */
    getMatchEditor<TModel extends EditorPaneModel>(model: TModel): EditorPaneDescriptor | undefined;


    getAllEditors(): readonly EditorPaneDescriptor[];
    getAllEditorsPair(): readonly Pair<EditorPaneDescriptor, Constructor<EditorPaneModel>[]>[];
}

export class EditorPaneDescriptor<TServices extends IService[] = any[]> {

    constructor(
        public readonly ctor: Constructor<EditorPaneView, [...services: TServices]>,
    ) {}
}

export class EditorPaneRegistrant implements IEditorPaneRegistrant {

    // [fields]

    public readonly type =  RegistrantType.EditorPane;
    private readonly _mapViewToModels = new Map<EditorPaneDescriptor, Constructor<EditorPaneModel>[]>();

    // [constructor]

    constructor() {}

    // [public methods]

    public initRegistrations(serviceProvider: IServiceProvider): void {
        registerRichTextEditor(serviceProvider);
        // TODO: dashboard registers here
    }

    public registerEditor(viewCtor: EditorPaneDescriptor, modelCtors: Constructor<EditorPaneModel>[]): void {
        this._mapViewToModels.set(viewCtor, modelCtors);
    }

    public getMatchEditor<TModel extends EditorPaneModel>(model: TModel): EditorPaneDescriptor | undefined {
        const matched: EditorPaneDescriptor[] = [];

        for (const [viewCtor, modelCtors] of this._mapViewToModels.entries()) {
            for (const modelCtor of modelCtors) {
                
                // Direct check on constructor type (ignores prototype chain)
                if (model.constructor === modelCtor) {
                    matched.push(viewCtor);
                    break;
                }

                // normal case: prototype check
                if (model.constructor instanceof modelCtor) {
                    matched.push(viewCtor);
                    break;
                }
            }
        }

        const first = matched[0];
        if (!first) {
            return undefined;
        }

        const atLeastOne = [first, ...matched.slice(1)] as const;
        return model.prefersWhich(atLeastOne);
    }

    public getAllEditors(): readonly EditorPaneDescriptor[] {
        return [...this._mapViewToModels.keys()];
    }

    public getAllEditorsPair(): readonly Pair<EditorPaneDescriptor, Constructor<EditorPaneModel>[]>[] {
        return [...this._mapViewToModels.entries()];
    }
}