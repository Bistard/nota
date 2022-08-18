import { deepCopy } from "src/base/common/util/object";
import { isObject, Pair } from "src/base/common/util/type";

/**
 * An interface only for {@link ConfigStorage}.
 */
export interface IConfigStorage {

    /**
     * Get all the sections of the storage. Section are seperated by `.`.
     */
    readonly sections: string[];
    
    /**
     * Get the actual data model of the storage.
     */
    readonly model: any;

    /**
     * @description Get configuration at given section.
     * @param section see {@link ConfigStorage}.
     * @throws An exception will be thrown if the section is invalid.
     * @note If section is not provided, the whole configuration will be 
     * returned.
     */
    get<T>(section?: string): T;

    /**
     * @description Set configuration at given section.
     * @param section see {@link ConfigStorage}.
     * @throws An exception will be thrown if the section is invalid.
     */
    set(section: string, configuration: any): void;

    /**
     * @description Delete configuration at given section.
     * @param section see {@link ConfigStorage}.
     * @note Returns a boolean indicates if the operation successed.
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
 * will not be touched.
 */
export class ConfigStorage implements IConfigStorage {

    // [field]

    private readonly _sections: string[];
    private readonly _model: any;

    // [constructor]

    constructor(
        sections?: string[],
        model?: any,
    ) {
        this._sections = sections ?? [];
        this._model = model ?? Object.create(null);
    }

    // [public methods]

    get sections(): string[] {
        return this._sections;
    }

    get model(): any {
        return this._model;
    }

    public get<T>(section?: string): T {
        if (section) {
            return this.__getBySection(section);
        }
        return this._model;
    }

    public set(section: string, configuration: any): void {
        this.__addSections(section);
        this.__addToModel(section, configuration);
    }

    public delete(section: string): boolean {
        if (this.__deleteSections(section)) {
            return this.__deleteFromModel(section);
        }
        return false;
    }

    public isEmpty(): boolean {
        return this._sections.length === 0;
    }

    public merge(others: IConfigStorage[]): void {
        for (const other of others) {
            if (other.isEmpty()) {
                continue;
            }

            // merge sections
            for (const newSection of other.sections) {
                this.__addSections(newSection);
            }

            // merge model data
            this.__mergeModelFrom(this._model, other.model);
        }
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
        const findIdx = this._sections.indexOf(deleteSection);
        if (findIdx === -1) {
            return false;
        }
        
        const oldSection = this._sections[findIdx]!;
        const lastDot = oldSection.lastIndexOf('.');
        if (lastDot === -1) {
            this._sections.splice(findIdx, 1);
        } else {
            this._sections.splice(findIdx, 1, oldSection.substring(0, lastDot));
        }
        return true;
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
 * `createDefaultStorage` method to auto generate a corresponding storage.
 */
export abstract class DefaultConfigStorage implements IConfigStorage {
    
    // [field]

    private readonly _storage: ConfigStorage;

    // [constructor]

    constructor() {
        const [sections, model] = this.createDefaultStorage();
        this._storage = new ConfigStorage(sections, model);
    }

    // [protected override method]

    protected abstract createDefaultStorage(): Pair<string[], Record<PropertyKey, any>>;

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
}