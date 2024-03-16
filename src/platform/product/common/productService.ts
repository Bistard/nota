import { InitProtector } from "src/base/common/error";
import { AsyncResult, err, ok } from "src/base/common/result";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { JsonSchemaValidator, jsonSafeParse } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { IFileService } from "src/platform/files/common/fileService";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IProductProfile, productProfileSchema } from "src/platform/product/common/product";
import { panic } from "src/base/common/utilities/panic";

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
        private readonly logService: ILogService,

    ) {
        this._protector = new InitProtector();
        this._profile = undefined;
    }

    // [public method]

    get profile(): IProductProfile {
        if (!this._profile) {
            panic('cannot get profile because the product service is not initialized.');
        }
        return this._profile;
    }

    public init(productURI: URI): AsyncResult<void, FileOperationError | SyntaxError | Error> {
        this.logService.trace('ProductService', 'initializing...');

        return this._protector.init('cannot initialize twice.')
        .toAsync()
        .andThen(() => this.fileService.readFile(productURI))
        .andThen(buffer => jsonSafeParse(buffer.toString()))
        .andThen((parsed: any) => {
            const validate = JsonSchemaValidator.validate(parsed, productProfileSchema);
            if (!validate.valid) {
                return err(new Error(`cannot parse product info with raw content: '${validate.errorMessage}'`));
            }
    
            this._profile = parsed;

            this.logService.trace('ProductService', `initialized.`, { at: URI.toString(productURI) });
            return ok();
        });
    }
}