import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { deepCopy } from "src/base/common/utilities/object";
import { DeepReadonly, Dictionary, isObject } from "src/base/common/utilities/type";
import { Section } from "src/platform/configuration/common/configuration";

export interface IConfigurationStorageChangeEvent {

    /** 
     * The section of the changed configuration. 
     */
    readonly sections: Section[];
}

export interface IReadonlyConfigurationStorage extends IDisposable {
    /** 
     * Get all the sections of the storage. Section are seperated by (`.`). 
     */
    readonly sections: Section[];

    /** 
     * Get the actual data model of the storage. 
     */
    readonly model: DeepReadonly<object>;

    /** 
     * Fires when any of the configuration is changed. 
     */
    readonly onDidChange: Register<IConfigurationStorageChangeEvent>;

    /**
     * @description Get configuration at given section.
     * @param section see {@link ConfigurationStorage}.
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be 
     * returned.
     * @note You may not change the value of the return value directly. Use `set`
     * instead.
     */
    get<T>(section: Section | undefined): DeepReadonly<T>;

    /**
     * @description Check if the current storage contains any configurations.
     */
    isEmpty(): boolean;

    /**
     * @description Returns a deep copy of the current storage.
     */
    clone(): ConfigurationStorage;

    /**
     * @description Conver the model into the JSON format.
     */
    toJSON(): string;
}

/**
 * An interface only for {@link ConfigurationStorage}.
 */
export interface IConfigurationStorage extends IReadonlyConfigurationStorage {
    
    /**
     * @description Set configuration at given section.
     * @param section see {@link ConfigurationStorage}. 
     * 
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is null, it overries the entire configuration.
     */
    set(section: Section | null, configuration: any): void;

    /**
     * @description Delete configuration at given section.
     * @param section see {@link ConfigurationStorage}.
     * @returns A boolean indicates if the operation successed.
     */
    delete(section: Section): boolean;

    /**
     * @description Merge the provided storages data into the current storage.
     * The overlapped sections will be override by the incoming ones.
     * @param ignoreNullity The incoming nullity value will be ignored (not 
     *                      merged) into the current configuration if turned on.
     *                      The default is true.
     */
    merge(others: IConfigurationStorage | IConfigurationStorage[], ignoreNullity?: boolean): void;
}

/**
 * @class A base class for configuration in-memory storage purpose. You may set 
 * / get configuration using sections under `.` as seperator.
 * @example section example: 'workspace.notebook.ifAutoSave'.
 * 
 * @note When storing sections, say initially we have `path1` as the only 
 * section. When setting a value to new a section `path1.path2`, the storage
 * will combine them into one single section named `path1.path2`. That means, 
 * every possible section that start with any of the existed sections will also 
 * be considered as valid sections.
 * @example
 * const storage = new ConfigurationStorage(['a.b.c'], { a: { b: { c: 'hello world' } } });
 * // sections like `a`, `a.b` are also valid sections.
 * 
 * @note When deleting a section, say `path1.path2`, storage will only delete
 * the actual object at that specific path, the other parts of section `path1` 
 * will not be touched. If deleting `path1`, the section `path1.path2` will also
 * be deleted.
 */
export class ConfigurationStorage extends Disposable implements IConfigurationStorage {

    // [event]

    private readonly _onDidChange = this.__register(new Emitter<IConfigurationStorageChangeEvent>());
    public readonly onDidChange = this._onDidChange.registerListener;

    // [field]

    private _sections: Section[];
    private _model: object;

    // [constructor]

    constructor(
        sections?: Section[],
        model?: object,
    ) {
        super();
        this._sections = sections ?? [];
        this._model = toConfigurationModel(model ?? Object.create({}), (msg) => console.warn(msg));

        // auto update sections
        if (this._sections.length === 0 && Object.keys(this._model).length !== 0) {
            getConfigurationModelSections(this._model, this._sections);
        }
    }

    // [public methods]

    get sections(): Section[] {
        return this._sections;
    }

    get model(): DeepReadonly<object> {
        return this._model;
    }

    public get<T>(section: Section | undefined): DeepReadonly<T> {
        if (section) {
            return this.__getBySection(section);
        }
        return <DeepReadonly<T>>this._model;
    }

    public set(section: Section | null, configuration: any): void {
        const sections: Section[] = [];

        if (section === null) {
            getConfigurationModelSections(configuration, sections);
            this._model = configuration;
        } else {
            sections.push(section);
            this.__addSections(section);
            addToConfigurationModel(this._model, section, configuration, (msg) => console.warn(msg));
        }

        this._onDidChange.fire({
            sections: sections,
        });
    }

    public delete(section: Section): boolean {
        if (this.__deleteSections(section)) {
            this.__deleteFromModel(section);

            this._onDidChange.fire({
                sections: [section],
            });
            return true;
        }
        return false;
    }

    public isEmpty(): boolean {
        return this._sections.length === 0 && Object.keys(this._model).length === 0;
    }

    public merge(others: IConfigurationStorage | IConfigurationStorage[], ignoreNullity: boolean = true): void {
        const sections: Section[] = [];
        if (!Array.isArray(others)) {
            others = [others];
        }

        for (const other of others) {
            if (other.isEmpty()) {
                continue;
            }

            // merge sections
            for (const newSection of other.sections) {
                this.__addSections(newSection);
                sections.push(newSection);
            }

            // merge model
            this.__mergeModelFrom(this._model, other.model, ignoreNullity);
        }

        this._onDidChange.fire({
            sections: sections,
        });
    }

    public clone(): ConfigurationStorage {
        return new ConfigurationStorage([...this._sections], deepCopy(this._model));
    }

    public toJSON(): string {
        return JSON.stringify(this.model, null, 4);
    }

    // [private helper methods]

    private __getBySection<T>(section: Section): T {
        const sections = section.split('.');

        let currModel = this._model;
        for (const sec of sections) {
            if (currModel && typeof currModel === 'object') {
                currModel = currModel[sec];
                continue;
            }
            throw new Error(`cannot get configuration section at '${section}'`);
        }

        if (currModel === undefined) {
            throw new Error(`cannot get configuration section at '${section}'`);
        }

        return <T>currModel;
    }

    private __addSections(newSection: Section): void {
        for (let i = 0; i < this._sections.length; i++) {
            const existedSection = this._sections[i]!;
            if (newSection.indexOf(existedSection) === 0) {
                // new section contains the existed one, we override it.
                this._sections.splice(i, 1, newSection);
                return;
            }
        }

        this._sections.push(newSection);
    }

    private __deleteSections(deleteSection: Section): boolean {
        let successed = false;
        const truncated: Section[] = [];

        const newSections = this._sections.filter((currSection) => {
            if (currSection.startsWith(deleteSection)) {
                if (currSection === deleteSection) {
                    const lastDot = currSection.lastIndexOf('.');
                    if (lastDot !== -1) {
                        // we truncate the last part of the section.
                        truncated.push(currSection.substring(0, lastDot));
                    } else {
                        // single section part, noop.
                    }
                }
                successed = true;
                return false;
            } {
                return true;
            }
        });

        newSections.push(...truncated);
        this._sections = newSections;
        return successed;
    }

    private __deleteFromModel(section: Section): boolean {
        const sections = section.split('.');
        const lastSection = sections.pop()!;

        let currModel = this._model;
        for (const subSection of sections) {
            let curr = currModel[subSection];
            if (curr && typeof curr === 'object') {
                curr = currModel[subSection];
                currModel = curr;
                continue;
            }
            return false;
        }

        if (currModel && typeof currModel === 'object') {
            delete currModel[lastSection];
            return true;
        }

        return false;
    }

    private __mergeModelFrom(destination: any, source: any, ignoreNullity: boolean): void {
        for (const key of Object.keys(source)) {
            if (key in destination) {
                if (isObject(destination[key]) && isObject(source[key])) {
                    this.__mergeModelFrom(destination[key], source[key], ignoreNullity);
                    continue;
                }
            }
            if (ignoreNullity) {
                destination[key] = deepCopy(source[key]) ?? destination[key];
            } else {
                destination[key] = deepCopy(source[key]);
            }
        }
    }
}

/**
 * @description Convert a raw configuration object to a configuration model.
 * Each key in the raw object represents a configuration section. Nested 
 * sections are denoted by using dot notation. This function will throw an error 
 * if it encounters a section that is not an object.
 *
 * @param raw The raw configuration object to be converted.
 * @param onError Callback function for error handling.
 * @returns The resulting configuration model.
 *
 * @example
 * const raw = { 'section.subSection': 'value' };
 * const onError = console.error;
 * const model = toConfigurationModel(raw, onError);
 * console.log(model); // model: { section: { subSection: 'value' } }
 */
function toConfigurationModel(raw: object, onError: (msg: string) => void): object {
    const obj = Object.create({});
    for (const key in raw) {
        addToConfigurationModel(obj, key, raw[key], onError);
    }
    return obj;
}

/**
 * @description Add a configuration to a given model at the specified section.
 * The section parameter can use dot notation to specify nested sections. This 
 * function will throw an error if it attempts to add a configuration to a 
 * section that is not an object.
 *
 * @param model The configuration model to which the configuration will be added.
 * @param section The section in the model where the configuration will be added.
 * @param configuration The configuration to be added.
 * @param onError Callback function for error handling.
 * 
 * @example
 * const model = { section: {} };
 * const section = 'section.subSection';
 * const configuration = 'value';
 * const onError = console.error;
 * addToConfigurationModel(model, section, configuration, onError);
 * console.log(model); // model: { section: { subSection: 'value' } }
 */
function addToConfigurationModel(model: object, section: Section, configuration: any, onError: (msg: string) => void): void {
    const sections = section.split('.');
    const lastSection = sections.pop()!;

    let currModel = model;
    for (const subSection of sections) {
        let curr = currModel[subSection];
        switch (typeof curr) {
            case 'undefined':
                curr = currModel[subSection] = Object.create({});
                break;
            case 'object':
                if (curr === null) {
                    return onError(`cannot add configuration '${configuration}' at section '${section}' with current configuration: ${curr}`);
                }
                break;
            default:
                return onError(`cannot add configuration '${configuration}' at section '${section}' with current configuration: ${curr}`);
        }
        currModel = curr;
    }

    if (isObject(currModel)) {
        currModel[lastSection] = configuration;
    } else {
        onError(`cannot add configuration '${configuration}' at section '${section}' with current configuration: ${currModel}`);
    }
}

/**
 * @description Given a provided model, generates every section split by `.`
 * that directs to the deepest non-object property.
 * @param model The provided model object.
 * @param sections The array for generated sections.
 * @example 
 * ```js
 * const arr = [];
 * getConfigurationModelSections({
 *     path1: {
 *         path2: 'hello'
 *     },
 *     path3: 'world'
 * }, arr)
 * // arr => ['path1.path2', 'path3']
 * ```
 */
function getConfigurationModelSections(model: Readonly<Dictionary<PropertyKey, any>>, sections: Section[]): void {
    const __handler = (model: Readonly<Dictionary<PropertyKey, any>>, section: Section, sections: Section[]): boolean => {
        let reachBottom = true;

        for (const propName of Object.keys(model)) {
            reachBottom = false;

            const value = model[propName]!;
            const nextSection = section ? section.concat(`.${propName}`) : section.concat(`${propName}`);

            if (isObject(value)) {
                const reached = __handler(value, nextSection, sections);
                if (reached) {
                    sections.push(nextSection);
                }
            } else {
                sections.push(nextSection);
            }
        }

        return reachBottom;
    };

    __handler(model, '', sections);
}