import { suite, test } from 'mocha';
import * as assert from 'assert';
import { buildOutlineTree } from "src/workbench/contrib/outline/outlineTree";
import { HeadingItem } from "src/workbench/contrib/outline/headingItem";
import { TreeLike } from 'src/base/common/utilities/type';
import { isEqualTreeLike } from 'test/utils/helpers';

suite('buildOutlineTree', () => {

    // [test helper functions]

    function assertOutlineTree(
        content: string[],
        expect: TreeLike<string>[],
    ): void {
        const resultTree = buildOutlineTree(content);
        const expectTree = { value: HeadingItem.ROOT_ID, children: expect } as TreeLike<string>;

        const isEqual = isEqualTreeLike(
            resultTree,
            expectTree,
            (headingItem, expectNode) => headingItem.data.name === expectNode.value, // same name
            headingItem => (headingItem.children?.length ?? 0) > 0,
            headingItem => headingItem.children ?? [],
            expectNode => (expectNode.children?.length ?? 0) > 0,
            expectNode => expectNode.children ?? [],
        );

        assert.ok(isEqual, 'The tree is not the same');
    }

    // [end]

    test('should return root node when content is empty', () => {
        assertOutlineTree([], []);

    });

    test('should correctly parse a single level 1 heading', () => {
        assertOutlineTree(
            ['# Heading 1'],
            [{ value: 'Heading 1' }]
        );
    });

    test('should correctly parse nested headings', () => {
        assertOutlineTree(
            [
                '# Heading 1',
                '## Subheading 1.1',
                '### Subheading 1.1.1',
                '## Subheading 1.2',
                '# Heading 2'
            ],
            [
                { value: 'Heading 1', children: [
                    { value: 'Subheading 1.1', children: [ 
                        { value: 'Subheading 1.1.1' } 
                    ] },
                    { value: 'Subheading 1.2' },
                ] },
                { value: 'Heading 2' },
            ]
        );
    });

    test('should ignore lines that are not headings', () => {
        assertOutlineTree(
            [
                '# Heading 1',
                'This is a paragraph.',
                '## Subheading 1.1'
            ],
            [
                { value: 'Heading 1', children: [
                    { value: 'Subheading 1.1' }
                ] }
            ]
        );
    });

    test('should handle excessive number of # characters in line', () => {
        assertOutlineTree(
            [
                '# Heading 1',
                '####### Not a heading',
                '## Subheading 1.1'
            ],
            [
                { value: 'Heading 1', children: [
                    { value: 'Subheading 1.1' },
                ] }
            ]
        );
    });

    test('should handle content from second level headings', () => {
        assertOutlineTree(
            [
                '## Subheading 1.1',
                '### Heading 2',
                '## Subheading 1.2',
            ],
            [
                { value: 'Subheading 1.1', children: [
                    { value: 'Heading 2' }
                ] },
                { value: 'Subheading 1.2' }
            ]
        );
    });

    test('should handle complex nested headings correctly - 1', () => {
        assertOutlineTree(
            [
                '# H1',
                '## H6',
                '### H7',
                '##### H8',
                '#### H9',
                '# H2'
            ],
            [
                { value: 'H1', children: [
                    { value: 'H6', children: [
                        { value: 'H7', children: [
                            { value: 'H8' },
                            { value: 'H9' },
                        ] }
                    ] }
                ] },
                { value: 'H2' }
            ]
        );

    });

    test('should handle complex nested headings correctly - 2', () => {
        assertOutlineTree(
            [
                '## H1',
                '# H2',
                '## H3',
                '## H4',
                '# H5',
                '### H6',
            ],
            [
                { value: 'H1' },
                { value: 'H2', children: [
                    { value: 'H3' },
                    { value: 'H4' }
                ] },
                { value: 'H5', children: [
                    { value: 'H6' }
                ] }
            ]
        );
    });
});
