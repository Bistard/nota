import * as assert from 'assert';
import { GlobalConfigService } from 'src/code/common/service/configService/configService';
import { FileService } from 'src/code/common/service/fileService/fileService';
import { FileLogService } from 'src/code/common/service/logService/fileLogService';
import { AbstractLogService, ILogInfo, LogLevel } from 'src/code/common/service/logService/abstractLogService';

class TestLogService extends AbstractLogService<ILogInfo> {
    
    constructor() {
        super(LogLevel.INFO);
    }

    public info(message: string): void {
        const formatted = `[info] [1991-01-01] - Message: ${message}`;
        this.log(LogLevel.INFO, { output: formatted });
    }

	public warn(message: string): void {
        const formatted = `[warning] [1991-01-01] - Message: ${message}`;
        this.log(LogLevel.WARN, { output: formatted });
    }

    public error(message: string, err: Error): void {
        const formatted = `[error] [1991-01-01] - Message: ${message} Error: ${err.name} ${err.message} ${err.stack}`;
        this.log(LogLevel.ERROR, { output: formatted });
    }

    protected async logger(logInfo: ILogInfo): Promise<void> {
        // define behaviour
        console.log(logInfo);
    }

}

suite('fileLogService-tests', () => {

    // new FileService
    const fileService = new FileService();
    const globalConfigService = new GlobalConfigService(fileService)
    const fileLogService = new FileLogService(LogLevel.TRACE, fileService, globalConfigService);
    const warning_out = "warning-level message";
    const error_out = "error-level message";
    const info_out = "info-level message";
    const critical_out = "critical-level message";
    
    test('warn', async () => {
        fileLogService.warn(warning_out, filePath, path);
        const logInfo = fileLogService.peek();
        const output = logInfo.output;
        assert.strictEqual(path, logInfo.path)
        assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
        assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9));
    });

    test('error', async () => {
        const error = new Error("Error-level error");
        fileLogService.error(error_out, error, filePath, path);
        const logInfo = fileLogService.peek();
        const output = logInfo.output;
        assert.strictEqual(path, logInfo.path)
        assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9)); 
        assert.strictEqual(error.name + ' ' + error.message + ' ' + error.message + ' ', 
        output.substring(output.indexOf("Error:") + 7)); 
        assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
        
    });

    test('info', async () => {
        fileLogService.info(info_out, filePath, path);
        const logInfo = fileLogService.peek();
        const output = logInfo.output;
        assert.strictEqual(path, logInfo.path);
        assert.strictEqual(info_out, output.substring(output.indexOf("Message:") + 9));
        assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
    });

    test('critical', async () => {
        const error = new Error("Critical-level error");
        fileLogService.error(error_out, error, filePath, path);
        const logInfo = fileLogService.peek();
        const output = logInfo.output;
        assert.strictEqual(path, logInfo.path)
        assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9)); 
        assert.strictEqual(error.name + ' ' + error.message + ' ' + error.message + ' ', 
        output.substring(output.indexOf("Error:") + 7)); 
        assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
    });

    test('set_level', async () => {
        fileLogService.setLevel(LogLevel.ERROR);
        assert.strictEqual(LogLevel.ERROR, fileLogService.getLogLevel());
    });

})
