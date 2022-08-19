import { ErrorHandler } from "src/base/common/error";
import { Emitter, Register, SignalEmitter } from "src/base/common/event";
import { IConfigChangeEvent, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IConfigRegistrant = createRegistrant<IConfigRegistrant>(RegistrantType.Configuration);

export const enum BuiltInConfigScope {
    Test = 'Test',
    Application = 'Application',
    User = 'User',
}
export type ExtensionConfigScope = unknown; // REVIEW: decision for later
export type ConfigScope = BuiltInConfigScope | ExtensionConfigScope;

/**
 * Configuration change event type when you are listening from {@link ConfigRegistrant}.
 */
export interface IScopeConfigChangeEvent extends IConfigChangeEvent {
    /** The scope of the changed configuration. */
    readonly scope: ConfigScope;
}

/**
 * An interface only for {@link ConfigRegistrant}.
 */
export interface IConfigRegistrant {
    /**
     * Fires whenever a configuration has changed.
     */
    readonly onDidChange: Register<IScopeConfigChangeEvent>;

    // TODO
    registerDefaultBuiltIn(id: ConfigScope, config: IConfigStorage): void;
    getDefaultBuiltIn(id: BuiltInConfigScope): IConfigStorage;
    registerDefaultExtension(id: ExtensionConfigScope, config: IConfigStorage): void;
    getDefaultExtension(id: ExtensionConfigScope): IConfigStorage;
    getAllDefaultExtensions(): Map<ExtensionConfigScope, IConfigStorage>;
}

/**
 * // TODO
 */
@IConfigRegistrant
class ConfigRegistrant implements IConfigRegistrant {

    // [event]

    private readonly _onDidChange: SignalEmitter<IConfigChangeEvent, IScopeConfigChangeEvent>;
    get onDidChange() { return this._onDidChange.registerListener; }
    
    // [field]

    private readonly _defaultBuiltin = new Map<BuiltInConfigScope, IConfigStorage>();
    private readonly _defaultExtension = new Map<ExtensionConfigScope, IConfigStorage>();

    // [constructor]

    constructor() {
        this._onDidChange = new SignalEmitter([], undefined!);
    }

    // [public methods]

    public registerDefaultBuiltIn(scope: BuiltInConfigScope, config: IConfigStorage): void {
        const existed = this._defaultBuiltin.get(scope);
        if (existed) {
            ErrorHandler.onUnexpectedError(new Error(`default configuraion with scope '${scope}' is already registered.`));
            return;
        }
        
        this._defaultBuiltin.set(scope, config);
        const unregister = this._onDidChange.add(config.onDidChange, event => {
            return {
                ...event,
                scope: scope,
            };
        });
    }

    public getDefaultBuiltIn(scope: BuiltInConfigScope): IConfigStorage {
        const config = this._defaultBuiltin.get(scope);
        if (!config) {
            ErrorHandler.onUnexpectedError(new Error(`default built-in configuration with scope '${scope}' not found`));
            return undefined!;
        }
        return config;
    }

    public registerDefaultExtension(scope: ExtensionConfigScope, config: IConfigStorage): void {
        const existed = this._defaultExtension.get(scope);
        if (existed) {
            throw new Error(`default configuraion with scope '${scope}' is already registered.`);
        }
        
        this._defaultExtension.set(scope, config);
        const unregister = this._onDidChange.add(config.onDidChange, event => {
            return {
                ...event,
                scope: scope,
            };
        });
    }

    public getDefaultExtension(scope: ExtensionConfigScope): IConfigStorage {
        const config = this._defaultExtension.get(scope);
        if (!config) {
            throw new Error(`default exntension configuration with scope '${scope}' not found`);
        }
        return config;
    }

    public getAllDefaultExtensions(): Map<ExtensionConfigScope, IConfigStorage> {
        return this._defaultExtension;
    }
}