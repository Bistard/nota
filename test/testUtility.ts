import { tmpdir } from "os";
import { join } from "path";
import { AbstractLogger, ILogService } from "src/base/common/logger";
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

/**
 * @class A logger that does nothing. Usually used for testing purpose.
 */
export class NullLogger extends AbstractLogger implements ILogService {
    constructor() {
        super();
    }
    public trace(message: string, ...args: any[]): void {}
    public debug(message: string, ...args: any[]): void {}
    public info(message: string, ...args: any[]): void {}
    public warn(message: string, ...args: any[]): void {}
    public error(message: string | Error, ...args: any[]): void {}
    public fatal(message: string | Error, ...args: any[]): void {}
}