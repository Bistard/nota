import { tmpdir } from "os";
import { join } from "path";
import { NullLogger } from "src/base/common/logger";
import { DiskEnvironmentService } from "src/code/platform/environment/common/diskEnvironmentService";
import { AbstractLifecycleService } from "src/code/platform/lifecycle/common/abstractLifecycleService";

export const TestDir = join(tmpdir(), 'nota', 'tests');

export class NullLifecycleService extends AbstractLifecycleService<number, number> {

    constructor() {
        super('Test', 0, () => '', new NullLogger());
    }

    public override async quit(): Promise<void> {
        this._onBeforeQuit.fire();
        this._onWillQuit.fire({reason: 1, join: () => {}});
    }
}

export class NullEnvironmentService extends DiskEnvironmentService {
    constructor() {
        super({
                _: [],
            }, {
            appRootPath: '',
            isPackaged: false,
            tmpDirPath: '',
            userDataPath: '',
            userHomePath: '',
            },
        );
    }
}