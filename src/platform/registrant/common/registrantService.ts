import { InitProtector } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { panic } from "src/base/common/utilities/panic";
import { IService, createService } from "src/platform/instantiation/common/decorator";
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
    init(): void;
    
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
export class RegistrantService implements IRegistrantService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _initProtector: InitProtector;
    private readonly _registrants: Map<RegistrantType, GetRegistrantByType<any>>;

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) {
        this.logService.trace('RegistrantService', 'Registrant service constructed.');
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

        this.logService.info('RegistrantService', 'Registrant registered.', { type: registrant.type });
    }

    public getRegistrant<T extends RegistrantType>(type: T): GetRegistrantByType<T> {
        const result = this._registrants.get(type);
        if (!result) {
            panic(`[RegistrantService] Cannot get registrant with type: '${type}'`);
        }
        
        return result;
    }

    public init(): void {
        const initResult = this._initProtector.init(`Cannot initialize twice.`);
        if (initResult.isErr()) {
            this.logService.warn('RegistrantService', initResult.error.message);
            return;
        }

        this._registrants.forEach((registrant, key) => {
            try {
                this.logService.info('RegistrantService', 'Initializing registrant...', { type: registrant.type });
                registrant.initRegistrations();
                this.logService.info('RegistrantService', 'Registrant initialized successfully.', { type: registrant.type });
            } catch (error: any) {
                this.logService.error('RegistrantService', `Registrant initialization failed.`, error);
            }
        });
    }

    public isInit(): boolean {
        return this._initProtector.isInit;
    }
}