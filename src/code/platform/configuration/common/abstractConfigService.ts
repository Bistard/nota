import { Disposable, IDisposable } from "src/base/common/dispose";
import { Listener, Register } from "src/base/common/event";
import { ILogService, LogLevel } from "src/base/common/logger";
import { Array } from "src/base/common/util/array";
import { IConfigCollection } from "src/code/platform/configuration/common/configCollection";
import { ConfigScope, IScopeConfigChangeEvent } from "src/code/platform/configuration/common/configRegistrant";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IConfigService = createDecorator<IConfigService>('configuration-service');

export const NOTA_DIR_NAME = '.nota';
export const DEFAULT_CONFIG_FILE_NAME = 'user.config.json';
export const USER_CONFIG_FILE_NAME = DEFAULT_CONFIG_FILE_NAME;
export const GLOBAL_CONFIG_FILE_NAME = 'nota.config.json';

export interface ConfigRegister<ConfigType> {
    (scope: ConfigScope, section: string, listener: Listener<ConfigType>, disposables?: IDisposable[], thisObject?: any): IDisposable;
}

class ConfigEmitter<T extends IScopeConfigChangeEvent> {

    private _orginRegister: Register<T>;
    private _myRegister?: ConfigRegister<any>;

    constructor(register: Register<T>, private readonly _collection: IConfigCollection) {
        this._orginRegister = register;
    }

    get registerListener() {
        if (!this._myRegister) {
            this._myRegister = <ConfigType, >(scope: ConfigScope, section: string, listener: Listener<ConfigType>, disposables?: IDisposable[], thisObject?: any) => {
                const disposable = this._orginRegister(e => this.__onDidChange(e, scope, section, listener), disposables, thisObject);
                return disposable;
            };
        }

        return this._myRegister;
    }

    private __onDidChange<ConfigType>(e: T, scope: ConfigScope, section: string, listener: Listener<ConfigType>): void {
        if (e.scope === scope) {
            /**
             * Either the whole configuration of that scope is changed OR
             * The parent of the section is changed.
             */
            if (e.sections.length === 0
                || Array.matchAny(e.sections, [section], (changes, desired) => desired.startsWith(changes))
            ) {
                const configuration = this._collection.get<ConfigType>(scope, section);
                listener(configuration);
            }
        }
    }
}

/**
 * A base interface for all config-service.
 */
export interface IConfigService extends IDisposable {
    /**
     * Fires when any of the configuration is changed.
     */
    onDidChange<ConfigType>(scope: ConfigScope, section: string, listener: Listener<ConfigType>, disposables?: IDisposable[], thisObject?: any): IDisposable;
    
    /**
     * @description Initialize all the registered configurations in 
     * {@link IConfigRegistrant} with the updatest resource from the disk.
     */
    init(logLevel?: LogLevel): Promise<void>;

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

    public onDidChange<ConfigType>(scope: ConfigScope, section: string, listener: Listener<ConfigType>, disposables?: IDisposable[], thisObject?: any): IDisposable {
        return this._onDidChange.registerListener(scope, section, listener, disposables, thisObject);
    }

    // [field]

    private readonly _onDidChange: ConfigEmitter<IScopeConfigChangeEvent>;
    protected readonly _collection: IConfigCollection;

    // [constructor]

    constructor(
        collection: IConfigCollection,
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this._onDidChange = new ConfigEmitter(collection.onDidChange, collection);
        this._collection = this.__register(collection);
    }

    // [public methods]

    public async init(logLevel?: LogLevel): Promise<void> {
        this.logService.trace('Main#ConfigService#initializing...');
        return this._collection.init().then(() => {
            if (logLevel === LogLevel.TRACE) {
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