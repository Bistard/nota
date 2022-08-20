import { Disposable } from "src/base/common/dispose";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ConfigStorage, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { IFileService } from "src/code/platform/files/common/fileService";

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
        private readonly logService: ILogService,
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
            const raw = await this.fileService.readFile(this._resource);
            const model = JSON.parse(raw.toString());
            const latestStorage = new ConfigStorage(undefined, model);
            this.merge([latestStorage]);
            this.logService.info(`Configuration loaded at ${this.resource.toString()}.`);
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