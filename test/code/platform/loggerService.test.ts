import * as assert from 'assert';
import { setup } from 'mocha';
import { Schemas, URI } from 'src/base/common/file/uri';
import { LogLevel, parseToLogLevel } from 'src/base/common/logger';
import { FileService, IFileService } from 'src/code/platform/files/common/fileService';
import { InMemoryFileSystemProvider } from 'src/code/platform/files/common/inMemoryFileSystemProvider';
import { IInstantiationService, InstantiationService } from 'src/code/platform/instantiation/common/instantiation';
import { FileLoggerService } from 'src/code/platform/logger/common/fileLoggerService';
import { NullLogger } from 'test/utils/utility';

suite.only('LoggerService', () => {

    function splitLogString(log: string): string[] {
        let parts: string[] = [];
        let temp = "";

        for (let i = 0; i < log.length; i++) {
            if (log[i] === '[') {
                i++;  // Skip the '[' character
                while (log[i] !== ']') {
                    temp += log[i];
                    i++;
                }
                parts.push(temp);
                temp = "";
            }
        }

        // Get the message part after the last ']' 
        let lastBracketPosition = log.lastIndexOf(']');
        if (lastBracketPosition !== -1 && lastBracketPosition < log.length - 1) {
            let customMessage = log.slice(lastBracketPosition + 1).trim();
            if (customMessage.length > 0) {
                parts.push(customMessage);
            }
        }

        return parts;
    }

    function createAssertLogMessage(fileService: IFileService, uri: URI, loggerLogLevel: LogLevel) {

        return async (actualLogLevel: LogLevel, message: string): Promise<void> => {
            const raw = (await fileService.readFile(uri)).toString();
            const line  = raw.split('\n').slice(-2, -1)[0]!; // retrieve the last line

            const [loggerName, contentLevel, contentMessage] = splitLogString(line).slice(1, undefined); // remove the timestamp
            assert.strictEqual(loggerName, URI.basename(uri));
            assert.strictEqual(parseToLogLevel(contentLevel), actualLogLevel);
            assert.strictEqual(contentMessage, message);
        };
    }

    suite('FileLoggerService', async function () {
        
        let instantiationService: IInstantiationService;
        let fileService: IFileService;
        let loggerService: FileLoggerService;
        let assertLastLineLogMessage: (actualLogLevel: LogLevel, message: string) => Promise<void>;

        setup(async () => {
            instantiationService = new InstantiationService();

            fileService = new FileService(new NullLogger());
            fileService.registerProvider(Schemas.FILE, new InMemoryFileSystemProvider());

            instantiationService.register(IFileService, fileService);

            loggerService = new FileLoggerService(LogLevel.INFO, instantiationService);
            assertLastLineLogMessage = createAssertLogMessage(fileService, URI.fromFile('base/test.log'), LogLevel.INFO);
        });

        test('basics', async () => {
            const logger = loggerService.createLogger(URI.fromFile('base'), { name: 'test.log' });
            await logger.waitInitialize();
            assert.ok(await fileService.exist(URI.fromFile('base/test.log')));

            await logger.info('hello');
            await assertLastLineLogMessage(LogLevel.INFO, 'hello');

            await logger.trace('world');
            await assertLastLineLogMessage(LogLevel.INFO, 'hello');
    
            await logger.debug('world');
            await assertLastLineLogMessage(LogLevel.INFO, 'hello');

            await logger.warn('world');
            await assertLastLineLogMessage(LogLevel.WARN, 'world');
    
            await logger.fatal('again');
            await assertLastLineLogMessage(LogLevel.FATAL, 'again');
        });
    });
});