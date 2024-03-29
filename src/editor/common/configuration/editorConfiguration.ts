import { IEditorModelOptions } from "src/editor/common/model";
import { IEditorViewOptions } from "src/editor/common/view";
import { EditorType, IEditorViewModelOptions } from "src/editor/common/viewModel";

/**
 * Consturctor option for 'EditorWidget'.
 */
export interface IEditorWidgetOptions extends IEditorModelOptions, IEditorViewModelOptions, IEditorViewOptions {

}

/**
 * An interface that represents a single editor option.
 */
export interface IEditorOption<K extends EditorOptionEnum, V> {
    
    /**
     * The ID of the option.
     */
    readonly ID: K;

    /**
     * The name of the option in string form.
     */
    readonly name: string;

    /**
     * The current value of the option.
     */
    readonly value: V;

    /**
     * The default value of the option.
     */
    readonly defaultValue: V;

    // TODO
    readonly schema?: any;

    /**
     * @description Updates the option with the given value.
     * @param value The value to be updated.
     * @returns A boolean indicates if the option has changed.
     */
    updateWith(value: V): boolean;
}

export class BasicEditorOption<K extends EditorOptionEnum, V> implements IEditorOption<K, V> {
    
    // [field]

    protected _value: V;
    
    // [constructor]

    constructor(
        public readonly ID: K,
        public readonly name: string,
        public readonly defaultValue: V,
        public readonly schema?: any,
    ) {
        this._value = defaultValue;
    }

    // [public method // getter]

    get value(): V { return this._value; }

    public updateWith(value: V): boolean {
        if (this._value === value) {
            return false;
        }
        this._value = value;
        return true;
    }
}

//#region [simple options]

export class BooleanEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, boolean> {}
export class NumberEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, number> {}
export class StringEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, string> {}

//#endregion

//#region [advanced options]

export class EditorModeOption<K extends EditorOptionEnum> extends BasicEditorOption<K, EditorType> {}

//#endregion

export const enum EditorOptionEnum {
    baseURI,
    mode,
    codeblockHighlight,
    ignoreHTML,
}

/**
 * The actual editor options that initially sets with all default values.
 */
export const EditorOptions = {
    baseURI: new StringEditorOption(EditorOptionEnum.baseURI, 'baseURI', '', {}),
    mode: new EditorModeOption(EditorOptionEnum.mode, 'mode', EditorType.Rich, {}),
    codeblockHighlight: new BooleanEditorOption(EditorOptionEnum.codeblockHighlight, 'codeblockHighlight', true, {}),
    ignoreHTML: new BooleanEditorOption(EditorOptionEnum.ignoreHTML, 'ignoreHTML', false, {}),
};

export type EditorOptionsType = typeof EditorOptions;
type FindEditorOptionKey<E extends EditorOptionEnum> = { [K in keyof EditorOptionsType]: EditorOptionsType[K]['ID'] extends E ? K : never }[keyof EditorOptionsType];
type FindEditorOptionValue<T> = T extends IEditorOption<any, infer V> ? V : never;

/**
 * Given the {@link EditorOptionEnum} it returns the type of the corresponding 
 * type in {@link IEditorOption}.
 */
export type FindEditorOption<T extends EditorOptionEnum> = FindEditorOptionValue<EditorOptionsType[FindEditorOptionKey<T>]>;