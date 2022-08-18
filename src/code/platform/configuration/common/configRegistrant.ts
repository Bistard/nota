import { ErrorHandler } from "src/base/common/error";
import { IConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { createRegistrant, RegistrantType } from "src/code/platform/registrant/common/registrant";

export const IConfigRegistrant = createRegistrant<IConfigRegistrant>(RegistrantType.Configuration);

export const enum BuiltInConfigScope {
    Application = 'Application',
    User = 'User',
}

// REVIEW: decision for later
export type ExtensionConfigScope = unknown;

export type ConfigScope = BuiltInConfigScope | ExtensionConfigScope;

/**
 * An interface only for {@link ConfigRegistrant}.
 */
export interface IConfigRegistrant {
    // TODO
    registerDefaultBuiltIn(id: ConfigScope, config: IConfigStorage): void;
    getDefaultBuiltIn(id: BuiltInConfigScope): IConfigStorage;
    registerDefaultExtension(id: ExtensionConfigScope, config: IConfigStorage): void;
    getDefaultExtension(id: ExtensionConfigScope): IConfigStorage | undefined;
    getAllDefaultExtensions(): Map<ExtensionConfigScope, IConfigStorage>;
}

/**
 * // TODO
 */
@IConfigRegistrant
class ConfigRegistrant implements IConfigRegistrant {

    // [field]

    private readonly _defaultBuiltin = new Map<BuiltInConfigScope, IConfigStorage>();
    private readonly _defaultExtension = new Map<ExtensionConfigScope, IConfigStorage>();

    // [constructor]

    constructor() {}

    // [public methods]

    public registerDefaultBuiltIn(id: BuiltInConfigScope, config: IConfigStorage): void {
        const existed = this._defaultBuiltin.get(id);
        if (existed) {
            ErrorHandler.onUnexpectedError(new Error(`default configuraion with id '${id}' is already registered.`));
            return;
        }
        this._defaultBuiltin.set(id, config);
    }

    public getDefaultBuiltIn(id: BuiltInConfigScope): IConfigStorage {
        const config = this._defaultBuiltin.get(id);
        if (!config) {
            ErrorHandler.onUnexpectedError(new Error(`default built-in configuration with id '${id}' not found`));
            return undefined!;
        }
        return config;
    }

    public registerDefaultExtension(id: ExtensionConfigScope, config: IConfigStorage): void {
        const existed = this._defaultExtension.get(id);
        if (existed) {
            throw new Error(`default configuraion with id '${id}' is already registered.`);
        }
        this._defaultExtension.set(id, config);
    }

    public getDefaultExtension(id: ExtensionConfigScope): IConfigStorage | undefined {
        return this._defaultExtension.get(id);
    }

    public getAllDefaultExtensions(): Map<ExtensionConfigScope, IConfigStorage> {
        return this._defaultExtension;
    }
}