import { IFileSystemProvider } from "src/base/common/file/file";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IFileService = createDecorator<IFileService>('file-service');

export interface IFileService {
    // TODO:
}

export class FileService implements IFileService {

    private readonly _providers: Map<string, IFileSystemProvider> = new Map();

    constructor(/* IFileLogService private readonly fileLogService: IFileLogService */) {

    }

    public async createFile(resource: string): Promise<void> {
    
    }

    public async writeFile(resource: string): Promise<void> {

    }

    public async readFile(resource: string): Promise<void> {

    }

    public async isExist(resource: string): Promise<boolean> {
        return false;
    }

}