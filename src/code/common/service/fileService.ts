import { createDecorator } from "src/code/common/service/instantiation/decorator";

export const IFileService = createDecorator<IFileService>('file-service');

export interface IFileService {

}

export class FileService implements IFileService {

    constructor() {

    }

}