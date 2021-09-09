import { createDecorator } from "src/code/common/service/instantiationService/decorator";

// #region
import "src/base/common/file/test/uri.test";
// #endregion

export const IUnitTestService = createDecorator<IUnitTestService>('test-service');

const _staticModules: string[] = [
    "src/base/common/file/test/uri.test.ts",
];

export interface IUnitTestService {
    readonly modules: string[];
    
    importModules(newModules?: string[]): void;
}

export class UnitTestService implements IUnitTestService {

    public readonly modules: string[] = [];
    private _didImport: boolean;

    constructor(modulesWaitToImport: string[] = [], autoImport: boolean = true) {
        if (modulesWaitToImport) {
            this.modules = modulesWaitToImport;
        }
        if (autoImport === true) {
            this.importModules();
            this._didImport = true;
        } else {
            this._didImport = false;
        }
    }

    public importModules(newModules: string[] = []): void {
        for (const module of newModules) {
            import(
                /* webpackChunkName: "my-chunk-name" */
                /* webpackMode: "lazy" */
                /* webpackExports: ["default", "named"] */
                module
            );
            this.modules.push(module);
        }
        
        if (this._didImport === true) {
            return;
        }

        for (const module of this.modules) {
            import(
                /* webpackChunkName: "my-chunk-name" */
                /* webpackMode: "lazy" */
                /* webpackExports: ["default", "named"] */
                module
            );
        }

        for (const module of _staticModules) {
            import(
                /* webpackChunkName: "my-chunk-name" */
                /* webpackMode: "lazy" */
                /* webpackExports: ["default", "named"] */
                module
            );
        }

        this._didImport = true;
    }

}