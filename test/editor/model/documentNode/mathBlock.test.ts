import * as assert from 'assert';
import { mathBlockRule } from 'src/editor/model/documentNode/node/mathBlock';

suite('mathBlockRule-Test', () => {
    test('should match a valid math block with content and ending newline', () => {
        const input = `$$\nsome content\n$$\n`;
        assert.ok(mathBlockRule.test(input));
    });

    test('should match a valid math block with content and no ending newline', () => {
        const input = `$$\nsome content\n$$`;
        assert.ok(mathBlockRule.test(input));
    });

    test('should match a math block with multiple lines of content', () => {
        const input = `$$\nline one\nline two\n$$`;
        assert.ok(mathBlockRule.test(input));
    });

    test('should match an empty math block', () => {
        const input = `$$\n$$`;
        assert.ok(mathBlockRule.test(input));
    });

    test('should match entire content with inner `$$`', () => {
        const input = `$$\ncontent with $$ inside\n$$`;
        assert.strictEqual(input.match(mathBlockRule)![0], input);
    });
    
    test('should not match if content does not end with `$$`', () => {
        const input = `$$\nsome content\n`;
        assert.ok(!mathBlockRule.test(input));
    });

    test('should not match if block does not start with `$$`', () => {
        const input = `content\n$$\n`;
        assert.ok(!mathBlockRule.test(input));
    });

    test('should not match if there is no newline after opening `$$`', () => {
        const input = `$$content\n$$`;
        assert.ok(!mathBlockRule.test(input));
    });

    test('should not match if no opening `$$` is present', () => {
        const input = `some content\n$$`;
        assert.ok(!mathBlockRule.test(input));
    });

    test('should match valid block with trailing newline after closing `$$`', () => {
        const input = `$$\ncontent\n$$\n`;
        assert.ok(mathBlockRule.test(input));
    });
});