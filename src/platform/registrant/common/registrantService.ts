import { Disposable, isDisposable } from "src/base/common/dispose";
import { InitProtector } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { panic } from "src/base/common/utilities/panic";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { GetRegistrantByType, RegistrantType } from "src/platform/registrant/common/registrant";

export const IRegistrantService = createService<IRegistrantService>('registrant-service');

/**
 * An interface only for {@link RegistrantService}.
 */
export interface IRegistrantService extends IService {
    
    /**
     * @description Registers a given registrant.
     * 
     * @template T - The type of the registrant.
     * @param registrant - The registrant object to be registered.
     * 
     * @throws {Error} Throws if the service is already initialized or if a 
     * registrant of the same type is already registered.
     */
    registerRegistrant<T extends RegistrantType>(registrant: GetRegistrantByType<T>): void;
    
    /**
     * @description Retrieves a registrant of a specific type.
     * 
     * @template T - The desired type of the registrant.
     * @param type - The type of the registrant to retrieve.
     * @returns The registrant of the given type.
     * 
     * @throws {Error} Throws if the desired registrant type is not found.
     */
    getRegistrant<T extends RegistrantType>(type: T): GetRegistrantByType<T>;
    
    /**
     * @description Initializes all its registered registrants.
     * @throws {Error} Throws if the service is already initialized.
     */
    init(provider: IServiceProvider): void;
    
    /**
     * @description Checks if the service is already initialized.
     */
    isInit(): boolean;
}

/**
 * @class The service is responsible for registering and managing registrants.
 * It provides mechanisms to add, retrieve, and initialize different kinds of 
 * registrants.
 */
export class RegistrantService extends Disposable implements IRegistrantService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _initProtector: InitProtector;
    private readonly _registrants: Map<RegistrantType, GetRegistrantByType<RegistrantType>>;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) {
        super();
        this.logService.debug('RegistrantService', 'RegistrantService constructed.');
        this._initProtector = new InitProtector();
        this._registrants = new Map();
    }

    // [public methods]

    public registerRegistrant<T extends RegistrantType>(registrant: GetRegistrantByType<T>): void {
        if (this.isInit()) {
            panic(`Cannot register registrant with type '${registrant.type}' after initialization.`);
        }
        
        const existed = this._registrants.get(registrant.type);
        if (existed) {
            panic(`The registrant with type '${registrant.type}' is already registered.`);
        }

        this._registrants.set(registrant.type, registrant);
        if (isDisposable(registrant)) {
            this.__register(registrant);
        }

        this.logService.trace('RegistrantService', `Registrant registered: ${registrant.type}`);
    }

    public getRegistrant<T extends RegistrantType>(type: T): GetRegistrantByType<T> {
        const registrant = this._registrants.get(type);
        if (!registrant) {
            panic(`[RegistrantService] Cannot get registrant with type: '${type}'`);
        }
        
        return <GetRegistrantByType<T>>registrant;
    }

    public init(provider: IServiceProvider): void {
        const initResult = this._initProtector.init(`Cannot initialize twice.`);
        if (initResult.isErr()) {
            this.logService.warn('RegistrantService', initResult.error.message);
            return;
        }

        this._registrants.forEach((registrant, key) => {
            try {
                this.logService.trace('RegistrantService', `(${registrant.type}) Initializing registrant...`);
                registrant.initRegistrations(provider);
                this.logService.trace('RegistrantService', `(${registrant.type}) Registrant initialized successfully.`);
            } catch (error: any) {
                this.logService.error('RegistrantService', `(${registrant.type}) Registrant initialization failed.`, error);
            }
        });
    }

    public isInit(): boolean {
        return this._initProtector.isInit;
    }
}