import { IDisposable } from "src/base/common/dispose";
import { ErrorHandler } from "src/base/common/error";
import { Register, SignalEmitter } from "src/base/common/event";
import { IConfigChangeEvent, IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IConfigRegistrant = createRegistrant<IConfigRegistrant>(RegistrantType.Configuration);

export const enum BuiltInConfigScope {
    Test = 'Test',
    Application = 'Application',
    User = 'User',
    Extension = 'Extension',
}
export type ExtensionConfigScope = unknown; // REVIEW: decision for later
export type ConfigScope = BuiltInConfigScope | ExtensionConfigScope;

/**
 * Configuration change event type that tells the scope of the configuration.
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
    registerDefaultBuiltIn(scope: BuiltInConfigScope, config: IConfigStorage): void;
    getDefaultBuiltIn(scope: BuiltInConfigScope): IConfigStorage;
    unregisterDefaultBuiltIn(scope: BuiltInConfigScope): boolean;

    registerDefaultExtension(scope: ExtensionConfigScope, config: IConfigStorage): void;
    getDefaultExtension(scope: ExtensionConfigScope): IConfigStorage;
    unregisterDefaultExtension(scope: ExtensionConfigScope): boolean;

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

    private readonly _defaultBuiltIns = new Map<BuiltInConfigScope, IConfigStorage>();
    private readonly _defaultExtensions = new Map<ExtensionConfigScope, IConfigStorage>();
    private readonly _onDidChangeDisposables = new Map<ConfigScope, IDisposable>();

    // [constructor]

    constructor() {
        this._onDidChange = new SignalEmitter([], undefined!);
    }

    // [public methods]

    public registerDefaultBuiltIn(scope: BuiltInConfigScope, config: IConfigStorage): void {
        const existed = this._defaultBuiltIns.get(scope);
        if (existed) {
            ErrorHandler.onUnexpectedError(new Error(`default configuraion with scope '${scope}' is already registered.`));
            return;
        }
        
        this._defaultBuiltIns.set(scope, config);
        const unregister = this._onDidChange.add(config.onDidChange, event => {
            return {
                ...event,
                scope: scope,
            };
        });
        this._onDidChangeDisposables.set(scope, unregister);
    }

    public getDefaultBuiltIn(scope: BuiltInConfigScope): IConfigStorage {
        const config = this._defaultBuiltIns.get(scope);
        if (!config) {
            ErrorHandler.onUnexpectedError(new Error(`default built-in configuration with scope '${scope}' not found`));
            return undefined!;
        }
        return config;
    }

    public unregisterDefaultBuiltIn(scope: BuiltInConfigScope): boolean {
        const unregister = this._onDidChangeDisposables.get(scope);
        unregister?.dispose();

        const config = this._defaultBuiltIns.get(scope);
        config?.dispose();
        
        return this._defaultBuiltIns.delete(scope);
    }

    public registerDefaultExtension(scope: ExtensionConfigScope, config: IConfigStorage): void {
        const existed = this._defaultExtensions.get(scope);
        if (existed) {
            throw new Error(`default configuraion with scope '${scope}' is already registered.`);
        }
        
        this._defaultExtensions.set(scope, config);
        const unregister = this._onDidChange.add(config.onDidChange, event => {
            return {
                ...event,
                scope: scope,
            };
        });
        this._onDidChangeDisposables.set(scope, unregister);
    }

    public getDefaultExtension(scope: ExtensionConfigScope): IConfigStorage {
        const config = this._defaultExtensions.get(scope);
        if (!config) {
            throw new Error(`default exntension configuration with scope '${scope}' not found`);
        }
        return config;
    }

    public unregisterDefaultExtension(scope: ExtensionConfigScope): boolean {
        const unregister = this._onDidChangeDisposables.get(scope);
        unregister?.dispose();

        const config = this._defaultExtensions.get(scope);
        config?.dispose();
        
        return this._defaultExtensions.delete(scope);
    }

    public getAllDefaultExtensions(): Map<ExtensionConfigScope, IConfigStorage> {
        return this._defaultExtensions;
    }
}