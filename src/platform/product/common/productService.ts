import { AsyncResult, InitProtector, err, errorToMessage, ok } from "src/base/common/error";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { JsonSchemaValidator, jsonSafeParse } from "src/base/common/json";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IProductProfile, productProfileSchema } from "src/platform/product/common/product";

export const IProductService = createService<IProductService>('product-service');

export interface IProductService extends IService {
    readonly profile: IProductProfile;
    init(productURI: URI): AsyncResult<void, FileOperationError | SyntaxError | Error>;
}

export class ProductService implements IProductService {

    declare _serviceMarker: undefined;

    // [fields]

    private _protector: InitProtector;
    private _profile?: IProductProfile;

    // [constructor]

    constructor(
        private readonly fileService: IFileService,
    ) {
        this._protector = new InitProtector();
        this._profile = undefined;
    }

    // [public method]

    get profile(): IProductProfile {
        if (!this._profile) {
            throw new Error('[ProductService] cannot get profile because the product service is not initialized.');
        }
        return this._profile;
    }

    public async init(productURI: URI): AsyncResult<void, FileOperationError | SyntaxError | Error> {

        const result = this._protector.init('[ProductService] cannot initialize twice.');
        if (result.isErr()) {
            return err(result.error);
        }
        
        const read = await this.fileService.readFile(productURI);
        if (read.isErr()) {
            return err(read.error);
        }

        const raw = read.unwrap().toString();
        const parse = jsonSafeParse<any>(raw);
        if (parse.isErr()) {
            return err(parse.error);
        }

        const content = parse.unwrap();
        const validate = JsonSchemaValidator.validate(content, productProfileSchema);
        if (!validate.valid) {
            return err(new Error(`[ProductService] cannot parse product info with raw content: '${validate.errorMessage}'`));
        }

        this._profile = content;
        return ok();
    }
}