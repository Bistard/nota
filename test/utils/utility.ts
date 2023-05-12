import { tmpdir } from "os";
import { Emitter, Register } from "src/base/common/event";
import { join } from "src/base/common/file/path";
import { URI } from "src/base/common/file/uri";
import { IStandardKeyboardEvent } from "src/base/common/keyboard";
import { AbstractLogger, ILogService } from "src/base/common/logger";
import { IKeyboardService } from "src/code/browser/service/keyboard/keyboardService";
import { ContextService } from "src/code/platform/context/common/contextService";
import { DiskEnvironmentService } from "src/code/platform/environment/common/diskEnvironmentService";
import { IBrowserEnvironmentService, IEnvironmentService } from "src/code/platform/environment/common/environment";
import { AbstractLifecycleService } from "src/code/platform/lifecycle/common/abstractLifecycleService";
import { IWindowConfiguration } from "src/code/platform/window/common/window";
import { nullObject } from "test/utils/helpers";

export const NotaName = 'nota';
export const TestDirName = 'tests';
export const TestPath = join(tmpdir(), NotaName, TestDirName);
export const TestURI = URI.fromFile(TestPath);

export class NullLifecycleService extends AbstractLifecycleService<number, number> {

    constructor() {
        super('Test', 0, () => '', new NullLogger());
    }

    public override async quit(): Promise<void> {
        this._onBeforeQuit.fire();
        this._onWillQuit.fire({reason: 1, join: () => {}});
    }
}

export class NullEnvironmentService extends DiskEnvironmentService implements IEnvironmentService {
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

export class NullBrowserEnvironmentService extends DiskEnvironmentService implements IBrowserEnvironmentService {

    constructor() {
        super({
            _: []
        }, {
            appRootPath: '',
            isPackaged: false,
            tmpDirPath: '',
            userDataPath: '',
            userHomePath: '',
        });
    }
    
    get machineID(): string {
        return '';
    }

    get windowID(): number {
        return NaN;
    }

    get configuration(): IWindowConfiguration {
        return nullObject();
    }
}

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
    public async flush(): Promise<void> {}
}

export class NullContextService extends ContextService {}

export class TestKeyboardService implements IKeyboardService {

    private readonly _emitter: Emitter<IStandardKeyboardEvent> = new Emitter();

    constructor() {}

    public fire(event: IStandardKeyboardEvent): void {
        this._emitter.fire(event);
    }

    get onKeydown(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }
    
    get onKeyup(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }

    get onKeypress(): Register<IStandardKeyboardEvent> {
        return this._emitter.registerListener;
    }

    dispose(): void {
        this._emitter.dispose();
    }
}