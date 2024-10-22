import * as assert from 'assert';
// import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { Strings } from 'src/base/common/utilities/string';
import { MarkdownLexer } from 'src/editor/model/markdownLexer';
import { DocumentNodeProvider } from 'src/editor/model/parser/documentNodeProvider';
import { DocumentParser } from 'src/editor/model/parser/parser';
import { buildSchema } from 'src/editor/model/schema';
import { MarkdownSerializer } from 'src/editor/model/serializer/serializer';

suite('MarkdownSerializer', () => {

    const nodeProvider = DocumentNodeProvider.create().register();
    const schema = buildSchema(nodeProvider);
    const lexer = new MarkdownLexer({});
    const docParser = new DocumentParser(schema, nodeProvider, /* options */);
    const serializer = new MarkdownSerializer(nodeProvider, { strict: true });

    /**
     * @description Expecting the serialized output is exactly the same as the 
     * input.
     */
    function expectSame(content: string): void {
        expectSameTo(content, content);
    }
    
    function expectSameTo(content: string, expect: string): void {
        const serializedContent = parseAndSerialize(content);

        // console.log('[input ]', Strings.escape(content));
        // console.log('[expect]', Strings.escape(expect));
        // console.log('[actual]', Strings.escape(serializedContent));

        assert.strictEqual(expect, serializedContent);
    }

    function parseAndSerialize(content: string): string {
        const tokens = lexer.lex(content);
        const doc = docParser.parse(tokens);
        const serializedContent = serializer.serialize(doc);
        // const doc = defaultMarkdownParser.parse(content);
        // const serializedContent = defaultMarkdownSerializer.serialize(doc);
        return serializedContent;
    }

    suite('Paragraph & Text', () => {
        test('Single paragraph', () => {
            expectSame('Some paragraph.');
        });
        
        test('Multi-line paragraph', () => {
            expectSame('This is a multi-line paragraph.\nIt has two lines.');
        });
        
        test('Backslash escape', () => {
            expectSame('\\');
        });
        
        test('Backslash followed by semicolon', () => {
            expectSame('\\;');
        });
        
        test('Special characters', () => {
            expectSame('!@#$%^&*()_+~=-[]{}\\|;:\'"<,>.?/');
        });
        
        test('Multiple spaces between words', () => {
            expectSame('This   is   text   with   multiple   spaces.');
        });
        
        test('Leading spaces', () => {
            expectSame('   This line has leading spaces.');
        });
        
        test('Trailing spaces', () => {
            expectSame('This line has trailing spaces.   ');
        });

        test('Leading and trailing spaces', () => {
            expectSame('   This line has both leading and trailing spaces.   ');
        });

        test('Empty paragraph', () => {
            expectSame('');
        });

        test('Single letter', () => {
            expectSame('A');
        });

        test('Special unicode characters', () => {
            expectSame('This paragraph contains unicode: 😊, 你, ü.');
        });

        test('Numbers', () => {
            expectSame('This is a paragraph with numbers 1234567890.');
        });

        test('Numbers and special characters', () => {
            expectSame('Numbers 1234, special characters: @#$%&*().');
        });

        test('Single word paragraph', () => {
            expectSame('Word');
        });

        test('Paragraph with single space', () => {
            expectSame(' ');
        });

        test('Mix of spaces and tabs', () => {
            expectSame('This paragraph has \t mixed spaces and tabs.');
        });
    });

    suite('Heading', () => {
        test('Level 1 - 6', () => {
            expectSame('# Heading 1');
            expectSame('## Heading 2');
            expectSame('### Heading 3');
            expectSame('#### Heading 4');
            expectSame('##### Heading 5');
            expectSame('###### Heading 6');
        });
        
        test('With spaces before and after', () => {
            expectSameTo('  ## Heading with spaces   ', '## Heading with spaces');
        });
        
        test('With special characters', () => {
            expectSame('### Heading with punctuation !@#$%^&*()');
        });
        
        test('With bold and italic', () => {
            expectSame('### **Bold Heading**');
            expectSame('### *Italic Heading*');
        });
        
        test('With links', () => {
            expectSame('### [Link Heading](https://example.com)');
        });
        
        test('Mixed formatting', () => {
            expectSame('### **Bold** and *Italic* and [Link](https://example.com)');
        });
        
        test('Invalid heading (too few hash marks)', () => {
            expectSame('##InvalidHeading'); // Missing space, so it should not be treated as a heading
        });
        
        test('Invalid heading (too many hash marks)', () => {
            expectSame('####### Invalid Heading'); // Markdown supports up to H6, so this should not be treated as a heading
        });
    });

    suite('html', () => {
        test('Basic empty div', () => {
            expectSame('<div></div>');
        });

        test('Div with text content', () => {
            expectSame('<div>hello world</div>');
        });

        test('Div with style attributes and markdown (not parsed)', () => {
            expectSame('<div style=\'font-family: "Comic Sans MS", "Comic Sans", cursive;\'>It is a pity, but markdown does **not** work in here for most markdown parsers.[Marked] handles it pretty well.</div>');
        });

        test('Iframe with various attributes', () => {
            expectSame('<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1r5SJvZE3c3LOLRJr3ZYtc?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>');
        });

        test('Self-closing tag (img)', () => {
            expectSame('<img src="image.jpg" alt="Sample image" />');
        });
    
        test('Nested elements', () => {
            expectSame('<div><span>Nested content <strong>inside</strong> div.</span></div>');
        });
    
        test('HTML comments', () => {
            expectSame('<!-- This is a comment -->\n<div>Content after comment</div>');
        });
    
        test('Doctype declaration', () => {
            expectSame('<!DOCTYPE html>\n<html>\n<body>\n<div>Hello World</div>\n</body>\n</html>');
        });
    
        test('Script tag', () => {
            expectSame('<script>alert("This is a script!");</script>');
        });
    
        test('Pre tag with code block', () => {
            expectSame('<pre><code>let x = 10;\nconsole.log(x);</code></pre>');
        });
    
        test('Special characters in attributes', () => {
            expectSame('<a href="https://example.com/?query=hello&amp;world"/>');
            // expectSame('<a href="https://example.com">Link with special characters</a>'); // REVIEW: this one does not work, gives '' string.
        });
    
        test('Invalid or unknown tags', () => {
            expectSameTo('<foo>Invalid tag</foo>', '');
        });
    
        test('Mixed case tag names', () => {
            expectSame('<Div>Hello World</Div>');
        });
    
        test('Custom data attributes', () => {
            expectSame('<div data-custom="123">Custom attribute content</div>');
        });
    
        test('Boolean attributes', () => {
            expectSame('<input type="checkbox" checked>');
        });
    
        test('Deeply nested elements', () => {
            expectSame('<div><ul><li><a href="#">Nested link inside list item</a></li></ul></div>');
        });
    
        test('Inline styles', () => {
            expectSame('<p style="color: red; font-size: 14px;">Styled paragraph</p>');
        });
    
        test('Broken unclosed tag', () => {
            expectSame('<div><p>Unclosed tag');
        });
    
        test('Entities', () => {
            expectSame('<p>Some special characters: &amp;, &lt;, &gt;, &quot;</p>');
        });
    
        test('Unicode characters', () => {
            expectSame('<div>Unicode: 😊, 你好, ü</div>');
        });
    });

    suite('Image', () => {
        test('Empty image syntax', () => {
            expectSame('![]()');
        });
    
        test('URL without alt text', () => {
            expectSame('![](image.jpg)');
        });
    
        test('Alt text without URL', () => {
            expectSame('![alt text]()');
        });
    
        test('Alt text and URL', () => {
            expectSame('![alt text](image.jpg)');
        });
    
        test('Alt text, URL, and title', () => {
            expectSame('![alt text](image.jpg "Image Title")');
        });
    
        test('URL with encoded spaces', () => {
            expectSame('![alt text](image%20with%20spaces.jpg)');
        });
    
        test('Title with parentheses', () => {
            expectSame('![alt text](image.jpg "Title with (parentheses)")');
        });
    
        test('URL with parentheses', () => {
            expectSameTo('![alt text](image(withparentheses).jpg)', '![alt text](image\\(withparentheses\\).jpg)');
        });
    
        test('Special characters in URL', () => {
            expectSame('![alt text](image@#$%.jpg)');
        });
    
        test('Special characters in alt text', () => {
            expectSame('![alt@#$%](image.jpg)');
        });
    
        // FIX: should work after 'marked' update
        test.skip('Special characters in title', () => {
            expectSame('![alt text](image.jpg "Title with @#$%&*")');
        });
    
        test('Escaped characters in URL', () => {
            expectSame('![alt text](image\\(escaped\\).jpg)');
        });
    
        test('Multiple parentheses in URL', () => {
            expectSameTo('![alt text](image((multiple)).jpg)', '![alt text](image\\(\\(multiple\\)\\).jpg)');
        });
    
        test('Missing closing parenthesis in URL', () => {
            expectSame('![alt text](image.jpg');
        });
    
        test('Leading and trailing spaces in alt text', () => {
            expectSame('![   alt text   ](image.jpg)');
        });
    
        test('Leading and trailing spaces in URL', () => {
            expectSameTo('![alt text](   image.jpg   )', '![alt text](image.jpg)');
        });
    
        test('Leading and trailing spaces in title', () => {
            expectSame('![alt text](image.jpg "   Image Title   ")');
        });
    
        test('Empty title and URL', () => {
            expectSame('![alt text](" ")');
        });
    
        test('Incomplete syntax (missing closing square bracket)', () => {
            expectSame('![alt text(image.jpg)');
        });
    
        test('Incomplete syntax (missing closing parenthesis)', () => {
            expectSame('![alt text](image.jpg');
        });
    
        test('Newline inside alt text', () => {
            expectSame('![alt\ntext](image.jpg)');
        });
    
        test('Newline inside title', () => {
            expectSame('![alt text](image.jpg "Title\nWithNewline")');
        });
    
        test('Multiple consecutive spaces in URL', () => {
            expectSame('![alt text](image%20%20with%20spaces.jpg)');
        });
    
        test('Escaped spaces in URL', () => {
            expectSame('![alt text](image\\ with\\ spaces.jpg)');
        });
    });

    suite('HorizontalRule', () => {
        test('Basic ---', () => {
            expectSame('---');
        });
        
        test('Basic ***', () => {
            expectSame('***');
        });
        
        test('Basic ___', () => {
            expectSame('___');
        });
        
        test('With spaces before and after ---', () => {
            expectSameTo('  ---  ', '---');
        });
        
        test('With spaces before and after ***', () => {
            expectSameTo('   ***   ', '***');
        });
        
        test('With spaces before and after ___', () => {
            expectSameTo(' ___ ', '___');
        });
        
        test('Invalid horizontal rule (too few dashes)', () => {
            expectSame('--'); // Invalid HR, should not be serialized as HR
        });
        
        test('Invalid horizontal rule (mixed symbols)', () => {
            expectSame('-*-'); // Invalid HR, should not be serialized as HR
        });
    });

    suite('escape', () => {
        test('Asterisk', () => {
            expectSame('\\*This is not bold\\*');
        });
        
        test('Underscore', () => {
            expectSame('\\_This is not italic\\_');
        });
        
        test('Hash in heading', () => {
            expectSame('\\# This is not a heading');
        });
        
        test('Square brackets for links', () => {
            expectSame('\\[This is not a link\\]');
        });
        
        test('Parentheses in link text', () => {
            expectSame('[Link text](https://example.com/\\(escaped\\))');
        });
        
        test('Backslash', () => {
            expectSame('This is a backslash: \\\\');
        });
        
        test('Mixed special characters', () => {
            expectSame('\\*Not bold\\*, \\_not italic\\_, \\# not a heading, \\[not a link\\], and \\\\ backslash.');
        });
        
        test('Special characters in heading', () => {
            expectSame('# Heading with \\*escaped asterisk\\* and \\_escaped underscore\\_');
        });
        
        test('Special characters in blockquote', () => {
            expectSame('> Blockquote with \\# escaped hash and \\[escaped brackets\\]');
        });
    });

    suite('Space', () => {
        test('Basic space between paragraphs', () => {
            expectSame('paragraph 1.\nparagraph2.');
            expectSame('paragraph 1.\n\nparagraph2.');
        });

        test('Newline at the start', () => {
            expectSame('\nThis paragraph has a newline at the start.');
        });

        test('Newline at the end', () => {
            expectSame('paragraph1\n');
        });

        test('Multiple newline at the start', () => {
            expectSame('\n\n\nparagraph1');
        });
        
        test('Multiple newline at the end', () => {
            expectSame('paragraph1\n\n\n');
        });

        test('One single new line', () => {
            expectSame('\n');
        });
        
        test('Two consecutive new lines', () => {
            expectSame('\n\n');
        });

        test('Multiple consecutive empty lines', () => {
            expectSame('\n\n\n');
        });

        test('Multiple paragraphs with varying space', () => {
            expectSame('paragraph1\nparagraph1.5\nparagraph2');
            expectSame('paragraph 1.\n\nparagraph2.');
            expectSame('paragraph1\nparagraph1.5\nparagraph2');
        });
    
        test('Excessive newlines between paragraphs', () => {
            expectSame('paragraph 1.\n\n\nparagraph2.');
            expectSame('paragraph 1.\n\n\n\nparagraph2.');
        });
    
        test('Irregular spaces and newlines between paragraphs', () => {
            expectSame('paragraph 1.\n\n       \n  \nparagraph2.');
            expectSame('paragraph 1.\n12\n       \n  \nparagraph2.');
        });
    
        test('Space before paragraphs', () => {
            expectSame('   paragraph 1.\n\n   paragraph 2.');
        });
    
        test('Space after paragraphs', () => {
            expectSame('paragraph 1.   \n\nparagraph 2.   ');
        });
    
        test('Spaces and newlines with tabs', () => {
            expectSameTo('paragraph 1.\n\t\nparagraph 2.', 'paragraph 1.\n    \nparagraph 2.'); // REVIEW: maybe need to change this behavior
            expectSame('paragraph1\n 1 \t 2 \nparagraph2');
        });
    });

    suite('lineBreak', () => {
        test('Basic line break', () => {
            expectSame('First line\nSecond line');
        });
        
        test('Line break with trailing spaces', () => {
            expectSame('First line    \nSecond line');
        });
        
        test('Line break at the beginning of text', () => {
            expectSame('  \nNew line after break');
        });
        
        test('Line break at the end of text', () => {
            expectSame('Line before break  \n');
        });
        
        test('Multiple consecutive line breaks', () => {
            expectSame('Line 1  \n  \nLine 3');
        });
        
        test('Line break inside a blockquote', () => {
            expectSame('> First line  \n> Second line');
        });
        
        test('Line break with bold text', () => {
            expectSame('**Bold line**  \nNew line');
        });
    });
});