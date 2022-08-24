import { IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { DeepReadonly, Mutable } from "src/base/common/util/type";
import { ConfigModel, IConfigModel } from "src/code/platform/configuration/common/configModel";
import { BuiltInConfigScope, ConfigScope, ExtensionConfigScope, IConfigRegistrant, IScopeConfigChangeEvent } from "src/code/platform/configuration/common/configRegistrant";
import { ConfigStorage, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { IFileService } from "src/code/platform/files/common/fileService";
import { Registrants } from "src/code/platform/registrant/common/registrant";

/**
 * An option interface for constructing a {@link ConfigCollection}.
 */
export interface ConfigCollectionOpts {
    resourceProvider: (scope: ConfigScope) => URI,
    readonly builtIn?: BuiltInConfigScope[];
    readonly extension?: ExtensionConfigScope[];
}

/**
 * An interface only for {@link ConfigCollection}.
 */
export interface IConfigCollection extends IDisposable {

    /**
     * Fires when any of the configuration is changed.
     */
    readonly onDidChange: Register<IScopeConfigChangeEvent>;
    
    /**
     * @description Initialize all the registered configurations in 
     * {@link IConfigRegistrant} with the updatest resource from the disk.
     */
    init(): Promise<void>;

    /**
     * @description Returns a deep-copyed storage that contains all the built-in
     * and extension configurations. The outest section name is their registered
     * config type. See {@link ConfigScope}.
     */
    inspect(): IConfigStorage;

    /**
     * @description Get specific configuration with the given scope.
     */
    get<T>(scope: ConfigScope, section: string | undefined): T;

    /**
     * @description Set specific configuration with the given scope.
     */
    set(scope: ConfigScope, section: string | null, configuration: any): void;

    /**
     * @description Delete configuration at given section with the given scope.
     * @returns A boolean indicates if the operation successed.
     */
    delete(scope: ConfigScope, section: string): boolean;

    /**
     * @description Update a new built-in configuration by the given scope.
     */
    updateBulitInConfiguration(scope: BuiltInConfigScope, newStorage: IConfigStorage): void;

    /**
     * @description Update a new extension configuration by the given scope.
     */
    updateExtensionConfiguration(scope: ExtensionConfigScope, newStorage: IConfigStorage): void;
}

/**
 * // TODO
 */
export class ConfigCollection implements IConfigCollection, IDisposable {

    // [event]

    get onDidChange() { return this._registrant.onDidChange; }

    // [field]

    private readonly _registrant: IConfigRegistrant = Registrants.get(IConfigRegistrant);
    
    private readonly _configurations: Map<BuiltInConfigScope, IConfigModel>;
    private readonly _extensionConfigurations: Map<ExtensionConfigScope, IConfigModel>;
    
    // [constructor]

    constructor(
        opts: ConfigCollectionOpts,
        private readonly fileService: IFileService,
        private readonly logService: ILogService,
    ) {
        // built-in
        this._configurations = new Map();
        if (opts.builtIn) {
            for (const scope of opts.builtIn) {
                const model = new ConfigModel(opts.resourceProvider(scope), <IConfigStorage>this._registrant.getDefaultBuiltIn(scope), fileService, logService)
                this._configurations.set(scope, model);
            }
        }
        
        // extension
        this._extensionConfigurations = new Map();
        if (opts.extension) {
            for (const scope of opts.extension) {
                const model = new ConfigModel(opts.resourceProvider(scope), <IConfigStorage>this._registrant.getDefaultExtension(scope), fileService, logService)
                this._extensionConfigurations.set(scope, model);
            }
        }
    }

    // [public methods]

    public async init(): Promise<void> {
        const configModels = [
            ...Array.from(this._configurations.values()),
            ...Array.from(this._extensionConfigurations.values()),
        ];
        
        const promises: Promise<void>[] = [];
        configModels.forEach(model => promises.push(model.init()));
        
        return Promise.all(promises) as unknown as Promise<void>;
    }

    public get<T>(scope: ConfigScope, section: string | undefined): T {
        const configuration = this.__getConfiguration(scope);
        return configuration.get(section);
    }

    public set(scope: ConfigScope, section: string | null, config: any): void {
        const configuration = this.__getConfiguration(scope);
        configuration.set(section, config);
    }

    public delete(scope: ConfigScope, section: string): boolean {
        const configuration = this.__getConfiguration(scope);
        return configuration.delete(section);
    }

    public updateBulitInConfiguration(scope: BuiltInConfigScope, newStorage: IConfigStorage): void {
        const old = this.__getConfiguration(scope);
        const resource = old.resource;
        old.dispose();

        const newModel = new ConfigModel(resource, newStorage, this.fileService, this.logService);
        this._configurations.set(scope, newModel);
    }

    public updateExtensionConfiguration(scope: ExtensionConfigScope, newStorage: IConfigStorage): void {
        const old = this.__getConfiguration(scope);
        const resource = old.resource;
        old.dispose();

        const newModel = new ConfigModel(resource, newStorage, this.fileService, this.logService);
        this._extensionConfigurations.set(scope, newModel);
    }

    public inspect(): IConfigStorage {
        const allConfiguration = new ConfigStorage();
        for (const [type, configuration] of this._configurations) {
            allConfiguration.set(type, configuration.model);
        }

        // REVIEW: extension inspect
        // for (const [type, configuration] of this._extensionConfigurations) {
        //     allConfiguration.set(type, configuration.model);
        // }
        
        return allConfiguration;
    }

    public dispose(): void {
        for (const [scope, configuration] of this._configurations) {
            configuration.dispose();
        }
        for (const [scope, configuration] of this._extensionConfigurations) {
            configuration.dispose();
        }
    }

    // [private helper methods]

    private __getConfiguration(scope: ConfigScope): IConfigModel {
        const configuration = 
            (this._configurations.get(<BuiltInConfigScope>scope) 
            ?? this._extensionConfigurations.get(<ExtensionConfigScope>scope)
        );
        if (!configuration) {
            throw new Error(`Provided configuration scope does not exist: ${scope}`);
        }
        return configuration;
    }

}