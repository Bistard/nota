import { iterPropEnumerable } from "src/base/common/utilities/object";
import { EditorType } from "src/editor/common/view";

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

//#region [options]

export class BooleanEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, boolean> {}
export class NumberEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, number> {}
export class StringEditorOption<K extends EditorOptionEnum> extends BasicEditorOption<K, string> {}
export class EditorModeOption<K extends EditorOptionEnum> extends BasicEditorOption<K, EditorType> {}
export const enum EditorOptionEnum {
    // [model]
    baseURI,
    writable,
    // [view]
    mode,
    codeblockHighlight,
    ignoreHTML,
    dropAnimation,
}

/**
 * The editor option type. This is constructed from {@link EDITOR_OPTIONS_DEFAULT}.
 */
export type EditorOptionsType = typeof EDITOR_OPTIONS_DEFAULT;

/**
 * The actual editor options that initially sets with all default values. The 
 * type of this object is {@link EditorOptionsType}.
 */
export const EDITOR_OPTIONS_DEFAULT = {
    // [model]
    baseURI:            new StringEditorOption(EditorOptionEnum.baseURI, 'baseURI', '', {}),
    writable:           new BooleanEditorOption(EditorOptionEnum.writable, 'writable', false, {}),
    
    // [view]
    mode:               new EditorModeOption(EditorOptionEnum.mode, 'mode', EditorType.Rich, {}),
    codeblockHighlight: new BooleanEditorOption(EditorOptionEnum.codeblockHighlight, 'codeblockHighlight', true, {}),
    ignoreHTML:         new BooleanEditorOption(EditorOptionEnum.ignoreHTML, 'ignoreHTML', false, {}),
    dropAnimation:      new BooleanEditorOption(EditorOptionEnum.dropAnimation, 'dropAnimation', true, {}),
};

//#endregion

export function toJsonEditorOption(options: EditorOptionsType): Record<string, any> {
    const opt = {};
    iterPropEnumerable(options, (propName, propValue: BasicEditorOption<EditorOptionEnum, any>) => {
        opt[propValue.name] = propValue.value;
    });
    return opt;
}

/**
 * Given the {@link EditorOptionEnum} it returns the type of the corresponding 
 * type in {@link IEditorOption}.
 */
export type FindEditorOption<T extends EditorOptionEnum> = __FindEditorOptionValue<EditorOptionsType[__FindEditorOptionKey<T>]>;
type __FindEditorOptionKey<E extends EditorOptionEnum> = { [K in keyof EditorOptionsType]: EditorOptionsType[K]['ID'] extends E ? K : never }[keyof EditorOptionsType];
type __FindEditorOptionValue<T> = T extends IEditorOption<any, infer V> ? V : never;

/**
 * Configuration options for initializing an `EditorWidget`.
 */
export interface IEditorWidgetOptions {

    /**
     * A base URI used as the prefix for any relative link token.
     */
    baseURI?: string;

    /**
     * Indicates if the editor allows modifications. When set to `false`, the content is read-only.
     */
    readonly writable: boolean;

    /**
     * Specifies the rendering mode of the editor's view.
     * @default EditorType.Rich
     */
    mode?: EditorType;

    /**
     * Enables syntax highlighting for code blocks.
     * @default true
     */
    codeblockHighlight?: boolean;

    /**
     * Determines whether HTML content is ignored during parsing.
     * @default false
     */
    ignoreHTML?: boolean;

    /**
     * Enables an animation effect when content is dropped into the editor.
     * @default true
     */
    dropAnimation?: boolean;
}
