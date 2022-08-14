import * as assert from 'assert';
import { BufferLogger, NullLogger } from 'src/base/common/logger';

suite('logger', () => {

    test('buffer-logger', () => {
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