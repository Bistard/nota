import { InitProtector, errorToMessage } from "src/base/common/error";
import { ILogService } from "src/base/common/logger";
import { executeOnce } from "src/base/common/util/function";
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
        this._initProtector = new InitProtector();
        this._registrants = new Map();
    }

    // [public methods]

    /**
     * @description Creates a registration function for a specific registrant type.
     * 
     * @template T - The type of the registrant.
     * @param type - The type of the registrant to register.
     * @param description - A descriptive text for the registrant.
     * @param callback - Function to execute once the registrant is retrieved.
     * 
     * @returns A function that takes a service provider and handles the registration process.
     */
    public static createRegister<T extends RegistrantType>(
        type: T, 
        description: string, // TODO
        callback: (registrant: GetRegistrantByType<T>) => void,
    ): (provider: IServiceProvider) => void 
    {
        return executeOnce(function (provider: IServiceProvider): void {
            const service = provider.getOrCreateService(IRegistrantService);
            const registrant = service.getRegistrant(type);
            callback(registrant);
        });
    }

    public registerRegistrant<T extends RegistrantType>(registrant: GetRegistrantByType<T>): void {
        if (this.isInit()) {
            throw new Error(`Cannot register registrant with type '${registrant.type}' after initialization.`);
        }
        
        const existed = this._registrants.get(registrant.type);
        if (existed) {
            throw new Error(`The registrant with type '${registrant.type}' is already registered.`);
        }

        this._registrants.set(registrant.type, registrant);
    }

    public getRegistrant<T extends RegistrantType>(type: T): GetRegistrantByType<T> {
        const result = this._registrants.get(type);
        if (!result) {
            throw new Error(`[RegistrantService] Cannot get registrant with type: '${type}'`);
        }
        
        return result;
    }

    public init(): void {
        this._initProtector.init(`[RegistrantService] Cannot initialize twice.`);
        this._registrants.forEach((registrant, key) => {
            try {
                registrant.initRegistrations();
            } catch (err) {
                this.logService.error(`Registrant initialization failed: ${errorToMessage(err)}`);
            }
        });
    }

    public isInit(): boolean {
        return this._initProtector.isInit;
    }
}