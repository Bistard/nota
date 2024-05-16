import { suite, test } from 'mocha';
import * as assert from 'assert';
import { buildOutlineTree } from 'src/workbench/services/outline/outlineService';

suite('buildOutlineTree', () => {
    test('should return root node when content is empty', () => {
        const content: string[] = [];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.data.name, 'Root');
        assert.strictEqual(result.data.depth, 0);
        assert.strictEqual(result.children?.length, 0);
    });

    test('should correctly parse a single level 1 heading', () => {
        const content: string[] = ['# Heading 1'];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children?.length, 1);
        const heading1 = result.children?.[0];
        assert.strictEqual(heading1?.data.name, 'Heading 1');
        assert.strictEqual(heading1?.data.depth, 1);
    });

    test('should correctly parse nested headings', () => {
        const content: string[] = [
            '# Heading 1',
            '## Subheading 1.1',
            '### Subheading 1.1.1',
            '## Subheading 1.2',
            '# Heading 2'
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children?.length, 2);

        const heading1 = result.children?.[0];
        const heading2 = result.children?.[1];
        assert.strictEqual(heading1?.data.name, 'Heading 1');
        assert.strictEqual(heading2?.data.name, 'Heading 2');
        assert.strictEqual(heading1?.children?.length, 2);

        const subheading1_1 = heading1?.children?.[0];
        const subheading1_2 = heading1?.children?.[1];
        assert.strictEqual(subheading1_1?.data.name, 'Subheading 1.1');
        assert.strictEqual(subheading1_2?.data.name, 'Subheading 1.2');
        assert.strictEqual(subheading1_1?.children?.length, 1);
        assert.strictEqual(subheading1_2?.children?.length, 0);

        const subheading1_1_1 = subheading1_1?.children?.[0];
        assert.strictEqual(subheading1_1_1?.data.name, 'Subheading 1.1.1');
        assert.strictEqual(subheading1_1_1?.children?.length, 0);
    });

    test('should ignore lines that are not headings', () => {
        const content: string[] = [
            '# Heading 1',
            'This is a paragraph.',
            '## Subheading 1.1'
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children?.length, 1);

        const heading1 = result.children?.[0];
        assert.strictEqual(heading1?.data.name, 'Heading 1');
        assert.strictEqual(heading1?.children?.length, 1);

        const subheading1_1 = heading1?.children?.[0];
        assert.strictEqual(subheading1_1?.data.name, 'Subheading 1.1');
    });

    test('should handle excessive number of # characters in line', () => {
        const content: string[] = [
            '# Heading 1',
            '####### Not a heading',
            '## Subheading 1.1'
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children?.length, 1);

        const heading1 = result.children?.[0];
        assert.strictEqual(heading1?.data.name, 'Heading 1');
        assert.strictEqual(heading1?.children?.length, 1);

        const subheading1_1 = heading1?.children?.[0];
        assert.strictEqual(subheading1_1?.data.name, 'Subheading 1.1');
    });

    test('should handle content from second level headings', () => {
        const content: string[] = [
            '## Subheading 1.1',
            '### Heading 2',
            '## Subheading 1.2',
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children!.length, 2);

        const subheading1_1 = result.children![0];
        assert.strictEqual(subheading1_1?.data.name, 'Subheading 1.1');
        assert.strictEqual(subheading1_1.data.depth, 2);
        assert.strictEqual(subheading1_1.children!.length, 1);

        const heading2 = subheading1_1.children![0];
        assert.strictEqual(heading2?.data.name, 'Heading 2');
        assert.strictEqual(heading2.data.depth, 3);
        assert.strictEqual(heading2.children!.length, 0);

        const subheading1_2 = result.children![1];
        assert.strictEqual(subheading1_2?.data.name, 'Subheading 1.2');
        assert.strictEqual(subheading1_2.data.depth, 2);
        assert.strictEqual(subheading1_2.children!.length, 0);
    });

    test('should handle complex nested headings correctly - 1', () => {
        const content: string[] = [
            '# H1',
            '## H6',
            '### H7',
            '##### H8',
            '#### H9',
            '# H2'
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children?.length, 2);

        const h1 = result.children?.[0];
        const h2 = result.children?.[1];
        assert.strictEqual(h1?.data.name, 'H1');
        assert.strictEqual(h2?.data.name, 'H2');
        assert.strictEqual(h1?.children?.length, 1);

        const h6 = h1?.children?.[0];
        assert.strictEqual(h6?.data.name, 'H6');
        assert.strictEqual(h6?.children?.length, 1);

        const h7 = h6?.children?.[0];
        assert.strictEqual(h7?.data.name, 'H7');
        assert.strictEqual(h7?.children?.length, 2);

        const h8 = h7?.children?.[0];
        const h9 = h7?.children?.[1];
        assert.strictEqual(h8?.data.name, 'H8');
        assert.strictEqual(h9?.data.name, 'H9');
        assert.strictEqual(h8?.children?.length, 0);
        assert.strictEqual(h9?.children?.length, 0);
    });

    test('should handle complex nested headings correctly - 2', () => {
        const content: string[] = [
            '## H1',
            '# H2',
            '## H3',
            '## H4',
            '# H5',
            '### H6',
        ];
        const result = buildOutlineTree(content);
        assert.strictEqual(result.children!.length, 3);

        const h1 = result.children![0];
        const h2 = result.children![1];
        const h5 = result.children![2];
        assert.strictEqual(h1?.data.name, 'H1');
        assert.strictEqual(h2?.data.name, 'H2');
        assert.strictEqual(h5?.data.name, 'H5');

        assert.strictEqual(h2.children!.length, 2);
        const h3 = h2.children![0];
        const h4 = h2.children![1];
        assert.strictEqual(h3?.data.name, 'H3');
        assert.strictEqual(h4?.data.name, 'H4');
        assert.strictEqual(h5?.children!.length, 1);

        const h6 = h5.children![0];
        assert.strictEqual(h6?.data.name, 'H6');
        assert.strictEqual(h6?.children!.length, 0);
    });
});
