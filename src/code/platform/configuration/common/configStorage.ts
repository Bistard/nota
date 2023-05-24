import { Disposable, IDisposable } from "src/base/common/dispose";
import { Emitter, Register } from "src/base/common/event";
import { deepCopy } from "src/base/common/util/object";
import { isObject } from "src/base/common/util/type";

export interface IConfigChangeEvent {
    
    /** 
     * The section of the changed configuration. 
     */
    readonly sections: string[];
}

/**
 * An interface only for {@link ConfigStorage}.
 */
export interface IConfigStorage extends IDisposable {

    /** Get all the sections of the storage. Section are seperated by `.` */
    readonly sections: string[];
    
    /** Get the actual data model of the storage. */
    readonly model: any;

    /** Fires when any of the configuration is changed. */
    readonly onDidChange: Register<IConfigChangeEvent>;

    /**
     * @description Get configuration at given section.
     * @param section see {@link ConfigStorage}.
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be 
     * returned.
     */
    get<T>(section: string | undefined): T;

    /**
     * @description Set configuration at given section.
     * @param section see {@link ConfigStorage}. If section is null, it overries
     *                the entire configuration.
     * @throws An exception will be thrown if the section is invalid.
     */
    set(section: string | null, configuration: any): void;

    /**
     * @description Delete configuration at given section.
     * @param section see {@link ConfigStorage}.
     * @returns A boolean indicates if the operation successed.
     */
    delete(section: string): boolean;

    /**
     * @description Merge the provided storages data into the current storage.
     * The overlapped sections will be override by the incoming ones.
     */
    merge(others: IConfigStorage[]): void;

    /**
     * @description Check if the current storage contains any configurations.
     */
    isEmpty(): boolean;

    /**
     * @description Returns a deep copy of the current storage.
     */
    clone(): ConfigStorage;
}

/**
 * @class A base class for configuration storage purpose. You may set / get
 * configuration using sections under `.` as seperator.
 * @example section example: 'workspace.notebook.ifAutoSave'.
 * 
 * @note When storing sections, say initially we have `path1` as the only 
 * section. When setting a value to new a section `path1.path2`, the storage
 * will combine them into one single section named `path1.path2`.
 * 
 * @note When deleting a section, say `path1.path2`, storage will only delete
 * the actual object at that specific path, the other parts of section `path1` 
 * will not be touched. If deleting `path1`, the section `path1.path2` will also
 * be deleted.
 */
export class ConfigStorage extends Disposable implements IConfigStorage {

    // [event]

    private readonly _onDidChange = this.__register(new Emitter<IConfigChangeEvent>());
    public readonly onDidChange = this._onDidChange.registerListener;

    // [field]

    private _sections: string[];
    private _model: any;

    // [constructor]

    constructor(
        sections?: string[],
        model?: any,
    ) {
        super();
        this._sections = sections ?? [];
        this._model = model ?? Object.create(null);

        // auto update sections
        if (this._sections.length === 0 && Object.keys(this._model).length !== 0) {
            getModelSections(this._sections, this._model);
        }
    }

    // [public methods]

    get sections(): string[] {
        return this._sections;
    }

    get model(): any {
        return this._model;
    }

    public get<T>(section: string | undefined): T {
        if (section) {
            return this.__getBySection(section);
        }
        return this._model;
    }

    public set(section: string | null, configuration: any): void {
        const sections: string[] = [];
        
        if (section === null) {
            getModelSections(configuration, sections);
            this._model = configuration;
        } else {
            sections.push(section);
            this.__addSections(section);
            this.__addToModel(section, configuration);
        }
        
        this._onDidChange.fire({
            sections: sections,
        });
    }

    public delete(section: string): boolean {
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

    public merge(others: IConfigStorage[]): void {
        const sections: string[] = [];
        
        for (const other of others) {
            if (other.isEmpty()) {
                continue;
            }

            // merge sections
            for (const newSection of other.sections) {
                this.__addSections(newSection);
                sections.push(newSection);
            }

            // merge model data
            this.__mergeModelFrom(this._model, other.model);
        }

        this._onDidChange.fire({
            sections: sections,
        });
    }

    public clone(): ConfigStorage {
        return new ConfigStorage([...this._sections], deepCopy(this._model));
    }

    // [private helper methods]

    private __getBySection<T>(section: string): T {
        const sections = section.split('.');
        
        let currModel = this._model;
        for (const sec of sections) {
            if (currModel && typeof currModel === 'object') {
                currModel = currModel[sec];
                continue;
            }
            throw new Error(`cannot get configuration section at: ${section}`);
        }

        return currModel;
    }

    private __addSections(newSection: string): void {
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

    private __deleteSections(deleteSection: string): boolean {
        let successed = false;
        const truncated: string[] = [];

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

    private __addToModel(section: string, configuration: any): void {
        const sections = section.split('.');
        const lastSection = sections.pop()!;

        let currModel = this._model;
        for (const subSection of sections) {
            let curr = currModel[subSection];
            switch (typeof curr) {
                case 'undefined':
                    curr = currModel[subSection] = Object.create(null);
                    break;
                case 'object':
                    if (curr !== null) {
                        break;
                    }
                default:
                    throw new Error(`cannot add configuration section at ${section}`);
            }
            currModel = curr;
        }

        if (currModel && typeof currModel === 'object') {
            currModel[lastSection] = configuration;
        } else {
            throw new Error(`cannot add configuration section at ${section}`);
        }
    }

    private __deleteFromModel(section: string): boolean {
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

    private __mergeModelFrom(destination: any, source: any): void {
        for (const key of Object.keys(source)) {
			if (key in destination) {
				if (isObject(destination[key]) && isObject(source[key])) {
					this.__mergeModelFrom(destination[key]!, source[key]!);
					continue;
				}
			}
			destination[key] = deepCopy(source[key]);
		}
    }
}

/**
 * @class An abstract wrapper class over {@link ConfigStorage}. You may override 
 * `createDefaultModel` method to auto generate a corresponding storage.
 */
export abstract class DefaultConfigStorage implements IConfigStorage {
    
    // [field]

    private readonly _storage: ConfigStorage;
    public readonly onDidChange: Register<IConfigChangeEvent>;

    // [constructor]

    constructor() {
        const model = this.createDefaultModel();
        const sections: string[] = [];
        getModelSections(model, sections);
        this._storage = new ConfigStorage(sections, model);
        this.onDidChange = this._storage.onDidChange;
    }

    // [protected override method]

    protected abstract createDefaultModel(): Record<PropertyKey, any>;

    // [public wrapper methods]

    get sections(): string[] { 
        return this._storage.sections;
    }
    
    get model(): any {
        return this._storage.model;
    }

    public get<T>(section?: string): T {
        return this._storage.get(section);
    }

    public set(section: string, configuration: any): void {
        this._storage.set(section, configuration);
    }

    public delete(section: string): boolean {
        return this._storage.delete(section);
    }

    public merge(others: ConfigStorage[]): void {
        return this._storage.merge(others);
    }

    public isEmpty(): boolean {
        return this._storage.isEmpty();
    }

    public clone(): ConfigStorage {
        return this._storage.clone();
    }

    public dispose(): void {
        this._storage.dispose();
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
 * getModelSections({
 *     path1: {
 *         path2: 'hello'
 *     },
 *     path3: 'world'
 * }, arr)
 * // arr => ['path1.path2', 'path3']
 * ```
 */
function getModelSections(model: Record<PropertyKey, any>, sections: string[]): void {
    const __handler = (model: Record<PropertyKey, any>, section: string, sections: string[]): boolean => {
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