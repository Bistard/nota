import * as assert from 'assert';
import { BufferLogger } from 'src/base/common/logger';
import { NullLogger } from 'test/utility';

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

});