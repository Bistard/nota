import { errorToMessage } from "src/base/common/error";
import { URI } from "src/base/common/file/uri";
import { JsonSchemaValidator } from "src/base/common/json";
import { IFileService } from "src/code/platform/files/common/fileService";
import { createService } from "src/code/platform/instantiation/common/decorator";
import { IProductProfile, productProfileSchema } from "src/code/platform/product/common/product";

export const IProductService = createService('product-service');

export interface IProductService {
    readonly profile: IProductProfile;
    init(productURI: URI): Promise<void>;
}

export class ProductService implements IProductService {

    // [fields]

    private _initalized: boolean;
    private _profile?: IProductProfile;

    // [constructor]

    constructor(
        private readonly fileService: IFileService,
    ) {
        this._initalized = false;
        this._profile = undefined;
    }

    // [public method]

    get profile(): IProductProfile {
        if (!this._profile) {
            throw new Error('[ProductService] not initialized.');
        }
        return this._profile;
    }

    public async init(productURI: URI): Promise<void> {
        
        if (this._initalized) {
            throw new Error('[ProductService] cannot initialize twice.');
        }
        this._initalized = true;

        // parsing
        try {
            const raw = (await this.fileService.readFile(productURI)).toString();
            const content = JSON.parse(raw);
            
            const result = JsonSchemaValidator.validate(content, productProfileSchema);
            if (!result.valid) {
                throw new Error(`[ProductService] cannot parse product info with raw content: '${result.errorMessage}'`);
            }

            this._profile = content;
        } 
        
        // error handling
        catch (err) {
            throw new Error(`[ProductService] cannot read product info at '${URI.toString(productURI)}'. The error message is : '${errorToMessage(err)}'`);
        }
    }
}