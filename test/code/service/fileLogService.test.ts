// import * as assert from 'assert';
// import { DataBuffer } from 'src/base/common/file/buffer';
// import { dirname, posix } from 'src/base/common/file/path';
// import { URI } from 'src/base/common/file/uri';
// import { DiskFileSystemProvider } from 'src/base/node/diskFileSystemProvider';
// import { fileExists } from 'src/base/node/io';
// import { FileService } from 'src/code/common/service/fileService/fileService';
// import { FileLogService } from 'src/code/common/service/logService/fileLogService';
// import { LogLevel } from 'src/code/common/service/logService/logService';
// import { APP_ROOT_PATH } from "src/base/electron/app";

// suite('fileLogService-tests', () => {

//     // new FileService
//     const fileService = new FileService();
//     const fileLogServiceLogger =  new FileLogService(fileService);
//     const warning_out = "warning-level message";
//     const error_out = "error-level message";
//     const info_out = "info-level message";
//     const critical_out = "critical-level message";
    
//     const filePath = "filePath";
//     const path = URI.fromFile(APP_ROOT_PATH);
//     test('warn', async () => {
//         fileLogServiceLogger.warn(warning_out, filePath, path);
//         const logInfo = fileLogServiceLogger.getPushedLog();
//         const output = logInfo.output;
//         assert.strictEqual(path, logInfo.path)
//         assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
//         assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9));
//     });

//     test('error', async () => {
//         const error = new Error("Error-level error");
//         fileLogServiceLogger.error(error_out, error, filePath, path);
//         const logInfo = fileLogServiceLogger.getPushedLog();
//         const output = logInfo.output;
//         assert.strictEqual(path, logInfo.path)
//         assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9)); 
//         assert.strictEqual(error.name + ' ' + error.message + ' ' + error.message + ' ', 
//         output.substring(output.indexOf("Error:") + 7)); 
//         assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
        
//     });

//     test('info', async () => {
//         fileLogServiceLogger.info(info_out, filePath, path);
//         const logInfo = fileLogServiceLogger.getPushedLog();
//         const output = logInfo.output;
//         assert.strictEqual(path, logInfo.path);
//         assert.strictEqual(info_out, output.substring(output.indexOf("Message:") + 9));
//         assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
//     });

//     test('critical', async () => {
//         const error = new Error("Critical-level error");
//         fileLogServiceLogger.error(error_out, error, filePath, path);
//         const logInfo = fileLogServiceLogger.getPushedLog();
//         const output = logInfo.output;
//         assert.strictEqual(path, logInfo.path)
//         assert.strictEqual(warning_out, output.substring(output.indexOf("Message:") + 9)); 
//         assert.strictEqual(error.name + ' ' + error.message + ' ' + error.message + ' ', 
//         output.substring(output.indexOf("Error:") + 7)); 
//         assert.strictEqual(filePath, output.substring(output.indexOf("file:") + 6));
//     });

//     test('set_level', async () => {
//         fileLogServiceLogger.setLevel(LogLevel.ERROR);
//         assert.strictEqual(LogLevel.ERROR, fileLogServiceLogger.getLogLevel());
//     });

// })
