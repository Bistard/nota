import * as assert from 'assert';
import { AbstractLogger, BufferLogger, ILogger, PipelineLogger } from 'src/base/common/logger';
import { NullLogger } from 'test/utils/utility';

suite('logger', () => {

    test('buffer-logger', async () => {
        let output: string = '';

        const logger = new BufferLogger();
        const wrapLogger = new NullLogger();
        
        (wrapLogger as any).info = (message: string) => {
            output += message;
        };
        
        logger.info('hello');
        logger.info(' ');
        logger.info('world');
        logger.info('!');
        assert.strictEqual(output, '');

        logger.setLogger(wrapLogger);
        assert.strictEqual(output, 'hello world!');
    });

    test('PipelineLogger', async () => {

        const logs1: string[] = [];
        const logs2: string[] = [];

        class TestLogger1 extends AbstractLogger implements ILogger {
            trace(message: string, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - trace');
            }
            debug(message: string, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - debug');
            }
            info(message: string, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - info');
            }
            warn(message: string, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - warn');
            }
            error(message: string | Error, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - error');
            }
            fatal(message: string | Error, ...args: any[]): void {
                logs1.splice(0, 0, 'log1 - fatal');
            }
            async flush(): Promise<void> {
                logs1.length = 0;
            }
        }

        class TestLogger2 extends AbstractLogger implements ILogger {
            trace(message: string, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - trace');
            }
            debug(message: string, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - debug');
            }
            info(message: string, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - info');
            }
            warn(message: string, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - warn');
            }
            error(message: string | Error, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - error');
            }
            fatal(message: string | Error, ...args: any[]): void {
                logs2.splice(0, 0, 'log2 - fatal');
            }
            async flush(): Promise<void> {
                logs2.length = 0;
            }
        }

        const pipeline = new PipelineLogger([new TestLogger1(), new TestLogger2()]);
        
        pipeline.trace('');
        assert.strictEqual(logs1[0], 'log1 - trace');
        assert.strictEqual(logs2[0], 'log2 - trace');

        pipeline.debug('');
        assert.strictEqual(logs1[0], 'log1 - debug');
        assert.strictEqual(logs2[0], 'log2 - debug');

        pipeline.info('');
        assert.strictEqual(logs1[0], 'log1 - info');
        assert.strictEqual(logs2[0], 'log2 - info');

        pipeline.warn('');
        assert.strictEqual(logs1[0], 'log1 - warn');
        assert.strictEqual(logs2[0], 'log2 - warn');

        pipeline.error('');
        assert.strictEqual(logs1[0], 'log1 - error');
        assert.strictEqual(logs2[0], 'log2 - error');


        pipeline.fatal('');
        assert.strictEqual(logs1[0], 'log1 - fatal');
        assert.strictEqual(logs2[0], 'log2 - fatal');

        await pipeline.flush();

        assert.strictEqual(logs1.length, 0);
        assert.strictEqual(logs2.length, 0);
    });

});