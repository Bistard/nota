import { Disposable, IDisposable } from "src/base/common/dispose";
import { Register } from "src/base/common/event";
import { ILogService, LogLevel } from "src/base/common/logger";
import { IConfigCollection } from "src/code/platform/configuration/common/configCollection";
import { ConfigScope, IScopeConfigChangeEvent } from "src/code/platform/configuration/common/configRegistrant";
import { IEnvironmentService } from "src/code/platform/environment/common/environment";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IConfigService = createDecorator<IConfigService>('configuration-service');

/**
 * A base interface for all config-service.
 */
export interface IConfigService extends IDisposable {
    /**
     * Fires when any of the configuration is changed.
     */
    onDidChange: Register<IScopeConfigChangeEvent>;
    
    /**
     * @description Initialize all the registered configurations in 
     * {@link IConfigRegistrant} with the updatest resource from the disk.
     */
    init(): Promise<void>;

    /**
     * @description Returns a deep-copyed object that contains all the built-in
     * and extension configurations. The outest property name is their 
     * registered configuration type. See {@link ConfigScope}.
     */
    inspect(): any;

    /**
     * @description Get specific configuration with the given scope.
     * @note If section is not provided, the whole configuration will be 
     * returned.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    get<T>(scope: ConfigScope, section?: string): T;
    
    /**
     * @description Set specific configuration with the given scope.
     * @param scope The scope of the configuration.
     * @param section The section directs to the update configuration. If not
     *                provided, the whole configuration under that scope will
     *                be replaced.
     * @param configuration The actual configuraion data.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    set(scope: ConfigScope, section: string | null, configuration: any): void;

    /**
     * @description Delete configuration at given section with the given scope.
     * @param scope The scope of the configuration.
     * @param section The section directs to the update configuration.
     * @returns A boolean indicates if the operation successed.
     * 
     * @throws An exception will be thrown if the section is invalid.
     */
    delete(scope: ConfigScope, section: string): boolean;
}

export class AbstractConfigService extends Disposable implements IConfigService {

    // [event]

    get onDidChange(): Register<IScopeConfigChangeEvent> { return this._collection.onDidChange; }

    // [field]

    protected readonly _collection: IConfigCollection;

    // [constructor]

    constructor(
        collection: IConfigCollection,
        @ILogService private readonly logService: ILogService,
        @IEnvironmentService private readonly environmentService: IEnvironmentService,
    ) {
        super();
        this._collection = this.__register(collection);
    }

    // [public methods]

    public async init(): Promise<void> {
        this.logService.trace('Main#ConfigService#initializing...');
        return this._collection.init().then(() => {
            if (this.environmentService.logLevel === LogLevel.TRACE) {
                this.logService.trace('All Configurations:\n', this._collection.inspect().model);
            }
            this.logService.info(`All configurations loaded successfully.`);
        });
    }

    public get<T>(scope: unknown, section?: string | undefined): T {
        return this._collection.get(scope, section);
    }

    public set(scope: unknown, section: string | null, configuration: any): void {
        this._collection.set(scope, section, configuration);
    }

    public delete(scope: unknown, section: string): boolean {
        return this._collection.delete(scope, section);
    }

    public inspect(): any {
        return this._collection.inspect().model;
    }

}