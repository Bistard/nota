import { deepCopy } from "src/base/common/util/object";
import { isObject } from "src/base/common/util/type";

export interface IConfigStorage {
    readonly sections: string[];
    readonly model: any;
    get<T>(section?: string): T;
    set(section: string, value: any): void;
    delete(section: string): boolean;
    merge(...others: ConfigStorage[]): void;
    isEmpty(): boolean;
    clone(): ConfigStorage;
}

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

    public set(section: string, value: any): void {
        this.__addSections(section);
        this.__addToModel(section, value);
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

    public merge(...others: ConfigStorage[]): void {
        for (const other of others) {
            if (other.isEmpty()) {
                continue;
            }

            // merge sections
            for (const newSection of other._sections) {
                this.__addSections(newSection);
            }

            // merge model data
            this.__mergeModelFrom(this._model, other._model);
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

    private __addToModel(section: string, value: any): void {
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
            currModel[lastSection] = value;
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