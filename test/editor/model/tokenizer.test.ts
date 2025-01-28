import * as assert from 'assert';
import { Arrays } from 'src/base/common/utilities/array';
import { printNaryTreeLike } from 'src/base/common/utilities/string';
import { isDefined } from 'src/base/common/utilities/type';
import { EditorToken } from 'src/editor/common/model';
import { MarkdownLexer } from 'src/editor/model/markdownLexer';
import { isEqualTreeLike, printEditorTokens } from 'test/utils/helpers';

suite('MarkdownTokenizer-test', async () => {

    const lexer = new MarkdownLexer({});
    function expectSame(raw: string, structure: TokenStructure[]): void {
        const tokens = lexer.lex(raw);

        // not same length, assert fail
        if (tokens.length !== structure.length) {
            __assertFail(tokens, structure);
        }

        // try assert each (dfs)
        Arrays.parallelEach([tokens, structure], (token, structure) => {
            const isEqual = isEqualTreeLike(
                token,
                structure,
                (token, structure) => {
                    const sameType = token.type === structure.type;
                    const sameToken = isDefined(structure.raw) 
                        ? token.raw === structure.raw 
                        : true; // only check when provided
                    assert.ok(sameType, `${token.type} != ${structure.type}`);
                    assert.ok(sameToken, `not same token content.\nexpect:\n${token.raw}\nactual:\n${structure.raw}`);
                    return sameType && sameToken;
                },
                token => (token['tokens'] ?? token['items'] ?? []).length > 0,
                token => (token['tokens'] ?? token['items'] ?? []),
                structure => (structure.children ?? []).length > 0,
                structure => structure.children ?? []
            );

            let tokensTree = '';
            let expectTree = '';
            printEditorTokens([token], false, (...contents) => contents.forEach(each => tokensTree += `${each}\n`));
            printNaryTreeLike(
                structure, 
                structure => structure.type,
                structure => (structure.children ?? []).length > 0,
                structure => structure.children ?? [],
                (...contents) => contents.forEach(each => expectTree += `${each}\n`)
            );

            if (!isEqual) {
                __assertFail([token], [structure]);
            }
        });

        function __assertFail(tokens: EditorToken[], structure: TokenStructure[]): never {
            let tokensTree = '';
            let expectTree = '';
            printEditorTokens(tokens, false, (...contents) => contents.forEach(each => tokensTree += `${each}\n`));
            for (const each of structure) {
                printNaryTreeLike(
                    each, 
                    structure => structure.type,
                    structure => (structure.children ?? []).length > 0,
                    structure => structure.children ?? [],
                    (...contents) => contents.forEach(each => expectTree += `${each}\n`)
                );
            }

            assert.fail(`Structure difference:\n[Actual]\n${tokensTree}\n[Expect]\n${expectTree}\n`);
        }
    }

    class TokenStructure {
        constructor(
            public readonly type: string,
            public readonly raw?: string,
            public readonly children?: TokenStructure[],
        ) {}
    }

    suite('mathBlock', () => {
        test('simple math block', () => {
            expectSame(
                '$$\nF = ma\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\nF = ma\n$$', undefined)
                ]
            );
        });

        test('empty math block', () => {
            expectSame(
                '$$\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\n$$', undefined)
                ]
            );
        });

        test('math block with inner $$', () => {
            expectSame(
                '$$\n\\begin{align*}\nF = ma \\tag{$\\text{$$}$}\n\\end{align*}\n$$',
                [
                    new TokenStructure('mathBlock', '$$\n\\begin{align*}\nF = ma \\tag{$\\text{$$}$}\n\\end{align*}\n$$', undefined)
                ]
            );
        });
    
        test('no space before $$ delimiter', () => {
            const mathContent = '\\text{Span}(S) = \\{ t_1 \\vec{v}_1 + \\cdots + t_k \\vec{v}_k : t_1, \\ldots, t_k \\in \\mathbb{F} \\}';
            expectSame(
                `$$\n${mathContent}\n$$`,
                [
                    new TokenStructure('mathBlock', `$$\n${mathContent}\n$$`, undefined)
                ]
            );
        });
    
        test('math block in blockquote context', () => {
            const mathContent = '\\text{Span}(S) = \\{ t_1 \\vec{v}_1 + \\cdots + t_k \\vec{v}_k : t_1, \\ldots, t_k \\in \\mathbb{F} \\}';
            expectSame(
                `> $$\n> ${mathContent}\n> $$`,
                [
                    new TokenStructure('blockquote', `> $$\n> ${mathContent}\n> $$`, [
                        new TokenStructure('mathBlock', `$$\n${mathContent}\n$$`)
                    ])
                ]
            );
        });
    
        test('equation environment', () => {
            const raw = 
                '$$\n\\begin{equation*}\n    Y_{i} = \\begin{pmatrix}\n    x_{1,i} \\\\ x_{2,i} \\\\ x_{3,i} \\\\ x_{N,i}\n    \\end{pmatrix}, \n    \\beta_{i} = \\begin{pmatrix}\n    c_{i} \\\\ A_{i1} \\\\ A_{i2} \\\\ A_{id}\n    \\end{pmatrix},\n    \\epsilon_{i} = \\begin{pmatrix}\n    \\varepsilon_{1,i} \\\\ \\varepsilon_{2,i} \\\\ \\varepsilon_{3,i} \\\\ \\\\ \\varepsilon_{N,i}\n    \\end{pmatrix},\n    X = \\begin{pmatrix}\n    1 & x_{0,1} & x_{0,2} & \\cdots & x_{0,d} \\\\\n    1 & x_{2,1} & x_{2,2} & \\cdots & x_{2,d} \\\\\n    \\vdots & \\vdots & \\vdots & \\ddots & \\vdots \\\\\n    1 & x_{N-1,1} & x_{N-1,2} & \\cdots & x_{N-1,d}\n    \\end{pmatrix}.\n\\end{equation*}\n$$';
            expectSame(
                raw,
                [
                    new TokenStructure('mathBlock', raw, undefined)
                ]
            );
        });
    
        test('aligned environment', () => {
            const raw = 
                '$$\n\\begin{aligned}\nJ(\\theta) = - \\frac{1}{T} \\log L(\\theta) = - \\frac{1}{T} \\sum_{t=1}^{T} \\sum_{-m \\leq j \\leq m} \\log P(w_{t+j} | w_t; \\theta); j \\neq 0\n\\tag{1}\n\\end{aligned}\n$$';
            expectSame(
                raw,
                [
                    new TokenStructure('mathBlock', raw, undefined)
                ]
            );
        });
    
        test('align environment', () => {
            const raw = 
                '$$\n\\begin{align*}\nJ(\\theta) = - \\frac{1}{T} \\log L(\\theta) = - \\frac{1}{T} \\sum_{t=1}^{T} \\sum_{-m \\leq j \\leq m} \\log P(w_{t+j} | w_t; \\theta); j \\neq 0\n\\tag{1}\n\\end{align*}\n$$';
            expectSame(
                raw,
                [
                    new TokenStructure('mathBlock', raw, undefined)
                ]
            );
        });
    
        test('pmatrix environment', () => {
            const raw = 
                '$$\n\\begin{pmatrix}\n    x_1 \\\\ x_2 \\\\ x_3 \\\\ x_4\n\\end{pmatrix}\n$$';
            expectSame(
                raw,
                [
                    new TokenStructure('mathBlock', raw, undefined)
                ]
            );
        });
    
        test('multiple consecutive math blocks', () => {
            expectSame(
                '$$\nF =ma\n$$\n$$\n$$',
                [
                    new TokenStructure('mathBlock', '$$\nF =ma\n$$\n', undefined),
                    new TokenStructure('mathBlock', '$$\n$$', undefined)
                ]
            );
        });

        test('inline math coexistence', () => {
            expectSame(
                'This has $a^2 + b^2$ inline math\n$$\nc^2 = a^2 + b^2\n$$', 
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'This has '),
                        new TokenStructure('mathInline', '$a^2 + b^2$'),
                        new TokenStructure('text', ' inline math')
                    ]),
                    new TokenStructure('mathBlock', '$$\nc^2 = a^2 + b^2\n$$')
                ]
            );
        });

        test('math block with escaped delimiters', () => {
            expectSame(
                '$$\n\\text{Contains \\$\\$ escaped delimiters}\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\n\\text{Contains \\$\\$ escaped delimiters}\n$$')
                ]
            );
        });
    
        test('adjacent math blocks', () => {
            expectSame(
                '$$\na\n$$\n$$\nb\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\na\n$$\n'),
                    new TokenStructure('mathBlock', '$$\nb\n$$')
                ]
            );
        });
    
        test('math block with markdown syntax inside', () => {
            expectSame(
                '$$\n## This should NOT be a heading\n**bold** text\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\n## This should NOT be a heading\n**bold** text\n$$')
                ]
            );
        });
    
        test('unclosed math block tokenized into paragraph', () => {
            expectSame(
                '$$\nUnclosed math content', 
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', '$$\nUnclosed math content')
                    ])
                ]
            );
        });
    
        test('math block with code fences', () => {
            expectSame(
                '```\n$$\nThis should NOT be math\n```\n$$\nReal math\n$$', 
                [
                    new TokenStructure('code', '```\n$$\nThis should NOT be math\n```\n'),
                    new TokenStructure('mathBlock', '$$\nReal math\n$$')
                ]
            );
        });
    
        test('math block with CRLF line endings gets standardized', () => {
            expectSame(
                '$$\r\nx + y = z\r\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\nx + y = z\n$$')
                ]
            );
        });
    
        test('math block with leading/trailing whitespace', () => {
            expectSame(
                '$$    \t\n   content\n$$ \t   ', 
                [
                    new TokenStructure('mathBlock', '$$    \t\n   content\n$$ \t   ')
                ]
            );
        });
    
        test('math block containing HTML', () => {
            expectSame(
                '$$\n<div>HTML in math</div>\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\n<div>HTML in math</div>\n$$')
                ]
            );
        });
        
        test('math block with inner $$', () => {
            expectSame(
                '$$\nfoo $$ bar\n$$', 
                [
                    new TokenStructure('mathBlock', '$$\nfoo $$ bar\n$$')
                ]
            );
        });
    });

    suite('mathInline', () => {

        test('basic inline math', () => {
            expectSame(
                'This is $E=mc^2$ inline math',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'This is '),
                        new TokenStructure('mathInline', '$E=mc^2$'),
                        new TokenStructure('text', ' inline math')
                    ])
                ]
            );
        });
    
        test('multiple inline math in same line', () => {
            expectSame(
                'When $a \\ne 0$, there are $2$ solutions to $ax^2 + bx + c = 0$',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'When '),
                        new TokenStructure('mathInline', '$a \\ne 0$'),
                        new TokenStructure('text', ', there are '),
                        new TokenStructure('mathInline', '$2$'),
                        new TokenStructure('text', ' solutions to '),
                        new TokenStructure('mathInline', '$ax^2 + bx + c = 0$')
                    ])
                ]
            );
        });
    
        test('escaped dollar sign inside inline math', () => {
            expectSame(
                'Escape: $\\$100$ and $\\$200$',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'Escape: '),
                        new TokenStructure('mathInline', '$\\$100$'),
                        new TokenStructure('text', ' and '),
                        new TokenStructure('mathInline', '$\\$200$')
                    ])
                ]
            );
        });
    
        test('inline math with backticks', () => {
            expectSame(
                'Formula: $x = `sum`_{i=1}^n i$ in code',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'Formula: '),
                        new TokenStructure('mathInline', '$x = `sum`_{i=1}^n i$'),
                        new TokenStructure('text', ' in code')
                    ])
                ]
            );
        });
    
        test('inline math adjacent to text', () => {
            expectSame(
                'abc$xyz$def',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'abc'),
                        new TokenStructure('mathInline', '$xyz$'),
                        new TokenStructure('text', 'def')
                    ])
                ]
            );
        });
    
        test('unclosed inline math', () => {
            expectSame(
                'This is $unclosed math',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'This is $unclosed math')
                    ])
                ]
            );
        });
    
        test('empty inline math', () => {
            expectSame(
                'Empty $$ here',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'Empty $$ here'),
                    ])
                ]
            );
        });
    
        test('inline math in link text', () => {
            expectSame(
                '[Link with $\\alpha$](https://example.com)',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('link', undefined, [
                            new TokenStructure('text', 'Link with '),
                            new TokenStructure('mathInline', '$\\alpha$')
                        ]),
                    ])
                ]
            );
        });
    
        test('inline math in bold context', () => {
            expectSame(
                '**Bold $x$ text**',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('strong', undefined, [
                            new TokenStructure('text', 'Bold '),
                            new TokenStructure('mathInline', '$x$'),
                            new TokenStructure('text', ' text')
                        ])
                    ])
                ]
            );
        });
    
        test('inline math with CRLF line endings', () => {
            expectSame(
                'Equation: $x\\in\\mathbb{R}$\r\nNext line',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'Equation: '),
                        new TokenStructure('mathInline', '$x\\in\\mathbb{R}$'),
                        new TokenStructure('text', '\nNext line')
                    ])
                ]
            );
        });
    
        test('inline math containing HTML', () => {
            expectSame(
                'Math: $<div>should</div>$',
                [
                    new TokenStructure('paragraph', undefined, [
                        new TokenStructure('text', 'Math: '),
                        new TokenStructure('mathInline', '$<div>should</div>$')
                    ])
                ]
            );
        });
    });
});