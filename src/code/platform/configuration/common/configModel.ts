import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/file/uri";
import { ConfigStorage, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { IFileService } from "src/code/platform/files/common/fileService";

// #region deprecate code

/**
 * @readonly The type of configService.
 * @deprecated
 */
export const enum IConfigType {
    USER,
    GLOBAL,
    TEST,
}

/**
 * @readonly Interface corresponds to the event `onDidChangeConfiguration` in 
 * `configServiceBase`.
 * @deprecated
 */
export interface IConfigChangeEvent {

    readonly type: IConfigType;
    readonly changes: IConfigChange;

}

/** @deprecated */
export interface IConfigChange {
    sections: string[],
}

/*******************************************************************************
 * Configuration Model
 ******************************************************************************/

/** @deprecated */
 export interface __IConfigModel {

    /** Get the actual structure of the configuration. */
    readonly object: Object;
    get<T>(section: string | undefined): T | undefined;
    set(section: string | undefined, value: any): void;
}

/**
 * @class The data structure to stores the actual configruration. Each 
 * `configServiceBase` consists exact one __ConfigModel.
 * @note The default constructor is a null javascript object.
 * @deprecated
 */
export class __ConfigModel implements __IConfigModel {

    // [field]

    private _object = Object.create(null);

    // [constructor]

    constructor(object?: Object) {
        this._object = object;
    }

    // [public methods]

    get object(): any {
        return this._object;
    }

    public get<T>(section: string | undefined = undefined): T | undefined {
        if (section) {
            return this.__getConfigBySection<T>(section, this._object);
        } else {
            return <T>this._object;
        }
    }

    public set(section: string | undefined, value: any): void {
        if (section) {
            return this.__setConfigBySection(section, this._object, value);
        } else {
            this._object = value;
        }
    }

    // [protected helper method]

    protected __setObject(obj: any): void {
        this._object = obj;
    }

    // [private helper methods]

    private __getConfigBySection<T>(section: string, config: any): T | undefined {

        const sections = section.split('.');
        
        let currentSection = config;
        for (const sec of sections) {
            try {
                currentSection = currentSection[sec];
            } catch (err) {
                return undefined;
            }
        }

        return currentSection;
    }

    private __setConfigBySection(section: string, config: any, value: any): void {

        const sections = section.split('.');
        const lastSection = sections.pop()!;

        let currentSection = config;
        for (const subSection of sections) {
            let curr = currentSection[subSection];
            if (typeof curr === 'undefined') {
                curr = currentSection[subSection] = Object.create(null);
            }
            currentSection = curr;
        }

        currentSection[lastSection] = value;
    }
}
// #endregion


/**
 * An interface only for {@link ConfigModel}.
 */
export interface IConfigModel extends IConfigStorage {
    /**
     * The corresponding resource path of the configuration model.
     */
    readonly resource: URI;

    /**
     * @description Initialize the configuration with the updatest resource from
     * the disk.
     * @throws An exception will be thrown if it failed.
     */
    init(): Promise<void>;
}

/**
 * @class A wrapper class on {@link ConfigStorage} except providing a resource
 * path for updating to the latest configuration by inboking `this.init()`.
 */
export class ConfigModel extends Disposable implements IConfigModel {

    // [field]

    private readonly _resource: URI;
    private readonly _storage: IConfigStorage;

    // [constructor]

    constructor(
        resource: URI,
        storage: IConfigStorage,
        private readonly fileService: IFileService,
    ) {
        super();
        this._resource = resource;
        this._storage = storage;
        this.__register(this._storage);
        this.__register(fileService.watch(resource));
    }

    // [getter]

    get sections(): string[] {
        return this._storage.sections;
    }

    get model(): any {
        return this._storage.model;
    }

    get resource(): URI { 
        return this._resource; 
    }

    get onDidChange() {
        return this._storage.onDidChange;
    }

    // [public methods]

    public async init(): Promise<void> {
        try {
            const content = await this.fileService.readFile(this._resource);
            const model = JSON.parse(content.toString());
            this.merge([model]);
        } catch (error) {
            throw error; // throw it out, we do not care it here.
        }
    }

    public set(section: string, configuration: any): void {
        this._storage.set(section, configuration);
    }

    public get<T>(section?: string | undefined): T {
        return this._storage.get(section);
    }

    public delete(section: string): boolean {
        return this._storage.delete(section);
    }

    public isEmpty(): boolean {
        return this._storage.isEmpty();
    }

    public merge(others: IConfigStorage[]): void {
        this._storage.merge(others);
    }

    public clone(): ConfigStorage {
        return this._storage.clone();
    }
}