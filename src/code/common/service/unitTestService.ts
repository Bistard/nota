import { GlobalConfigService, IGlobalConfigService } from "src/code/common/service/configService/globalConfigService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const IUnitTestService = createDecorator<IUnitTestService>('test-service');

export interface IUnitTestService {
    importModules(newModules?: string[]): void;
}

export class UnitTestService implements IUnitTestService {

    private _didImport: boolean = false;

    constructor(
        @IGlobalConfigService private readonly globalConfigService: GlobalConfigService,
    ) {

        if (this.globalConfigService.appMode === 'debug') {
            import("src/base/common/file/test/uri.test");
            import("src/code/common/service/test/fileService.test");
        }
        
    }

    // DEBUG: does not work for now, you need to hardcode the import as above
    public importModules(newModules: string[] = []): void {
        for (const module of newModules) {
            import(module);
        }
    }

}