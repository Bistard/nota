import * as assert from 'assert';
import { MarkdownLexer } from 'src/editor/model/markdownLexer';
import { DocumentNodeProvider } from 'src/editor/model/parser/documentNodeProvider';
import { DocumentParser } from 'src/editor/model/parser/parser';
import { buildSchema } from 'src/editor/model/schema';
import { MarkdownSerializer } from 'src/editor/model/serializer/serializer';

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
    return serializedContent;
}

suite('MarkdownSerializer (block-level)', () => {

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
    
        test('Heading with newline in content', () => {
            expectSame('## Heading with\nNewline'); // Newline in heading content
        });
    
        test('Heading with leading spaces after hash marks', () => {
            expectSameTo('##    Heading with leading spaces', '## Heading with leading spaces'); // Leading spaces should be removed
        });
    
        test('Heading with multiple spaces between words', () => {
            expectSame('## Heading   with   multiple   spaces');
        });
    
        test('Heading with escape characters', () => {
            expectSame('### Heading with \\*escaped\\* characters');
        });
    
        test('Heading with code span', () => {
            expectSame('### Heading with `code` span');
        });
    
        test('Heading with mixed formatting and escape', () => {
            expectSame('### **Bold** and *Italic* with \\*escaped\\* text and [Link](https://example.com)');
        });
    
        test('Heading with excessive hash marks', () => {
            expectSame('######## Excessive hash marks'); // Only up to 6 hashes should create a heading
        });
    
        test('Heading with no content after hash marks', () => {
            expectSame('### '); // Empty heading content should be allowed
        });
    
        test('Heading with trailing spaces', () => {
            expectSameTo('## Heading with trailing spaces   ', '## Heading with trailing spaces');
        });

        test('Heading with HTML tags', () => {
            expectSame('## Heading with <b>HTML</b> tags');
        });
    
        test('Heading with mixed Markdown and HTML', () => {
            expectSame('### **Bold** and <em>HTML Italic</em> in heading');
        });
    
        test('Heading with tab characters', () => {
            expectSame('## Heading\twith\ttabs'); // Tabs should be preserved in heading content
        });
    
        test('Heading with inline image', () => {
            expectSame('### Heading with ![alt text](image.jpg)');
        });
    
        test('Heading with an empty line after the hash marks', () => {
            expectSame('## \nHeading with newline after hash marks'); // Content should not be treated as part of the heading
        });
    });

    suite('html', () => {
        test('Basic empty div', () => {
            expectSame('<div></div>');
        });

        test('Single hr', () => {
            expectSame('<br>');
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
        });
    
        test('Invalid or unknown tags', () => {
            expectSame('<foo>Invalid tag</foo>');
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

    suite('inline_html', () => {
        test('Basic inline HTML - <em>', () => {
            expectSame('This is <em>emphasized</em> text.');
        });

        test('Basic inline HTML - <strong>', () => {
            expectSame('This is <strong>bold</strong> text.');
        });

        test('Inline HTML with attributes - <a>', () => {
            expectSame('Click <a href="https://example.com">here</a> for more information.');
        });

        test('Self-closing inline HTML tag - <img>', () => {
            expectSame('This is an image <img src="image.jpg" alt="Image description"/> inline.');
        });

        test('Inline HTML with multiple attributes', () => {
            expectSame('Click <a href="https://example.com" target="_blank">here</a> for more information.');
        });

        test('Inline HTML with special characters', () => {
            expectSame('This is <span title="&quot;Special&quot;">special</span> text.');
        });

        test('Mixed Markdown and inline HTML', () => {
            expectSame('This is *italic* and <strong>bold</strong> text with a [link](https://example.com).');
        });

        test('Nested inline HTML elements', () => {
            expectSame('This is <em><strong>nested</strong></em> inline HTML.');
        });

        test('Empty inline HTML tag', () => {
            expectSame('This is an empty inline tag: <br>.');
        });

        test('Invalid inline HTML tag', () => {
            expectSame('This is invalid <invalidtag>inline HTML</invalidtag>.');
        });

        test('Inline HTML with mismatched tags', () => {
            expectSame('This is <em>mismatched</strong> inline HTML tags.');
        });

        test('Inline HTML with incomplete tag', () => {
            expectSame('This is an incomplete tag: <em>');
        });
        
        test('Inline HTML with multiple incomplete tag', () => {
            expectSame('This is an incomplete tag: <em><strong><DiV>...');
        });

        test('Inline HTML tag with spaces', () => {
            expectSame('This is <em> emphasized text </em> with spaces around.');
        });

        test('Inline HTML tag with missing closing angle bracket', () => {
            expectSame('This is a tag with missing closing angle bracket: <em');
        });

        test('Inline HTML with multiple consecutive tags', () => {
            expectSame('This is <em>first</em><strong>second</strong> inline HTML.');
        });

        test('Inline HTML tag with content spanning multiple lines', () => {
            expectSame('This is <em>multi-line\ncontent</em> inside an inline HTML tag.');
        });

        // FIX: should work after 'marked' update
        test.skip('Inline HTML inside a code span', () => {
            expectSame('This is a code span with inline HTML: `<em>code</em>`.');
        });

        test('Inline HTML with escape sequences', () => {
            expectSame('This is inline HTML with escape sequences: &lt;em&gt;escaped&lt;/em&gt;.');
        });

        test('Self-closing inline tag with attribute', () => {
            expectSame('This is an image with title: <img src="image.jpg" title="Image"/>.');
        });

        test('Inline HTML tag within a heading', () => {
            expectSame('# Heading with <em>inline</em> HTML');
        });
        
        test('Inline HTML with no space between tags', () => {
            expectSame('This is <em>emphasized</em><strong>bold</strong> with no space.');
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
            expectSame('  ---  ');
        });
    
        test('With spaces before and after ***', () => {
            expectSame('   ***   ');
        });
    
        test('With spaces before and after ___', () => {
            expectSame(' ___ ');
        });
    
        test('Invalid horizontal rule (too few dashes)', () => {
            expectSame('--'); // Should not be serialized as HR
        });
    
        test('Invalid horizontal rule (mixed symbols)', () => {
            expectSame('-*-'); // Should not be serialized as HR
        });
    
        test('More than 3 dashes ---', () => {
            expectSame('------'); // Should be serialized as HR
        });
    
        test('More than 3 asterisks ***', () => {
            expectSame('******'); // Should be serialized as HR
        });
    
        test('More than 3 underscores ___', () => {
            expectSame('______'); // Should be serialized as HR
        });
    
        test('Horizontal rule with spaces between dashes', () => {
            expectSame('- - -');
        });
    
        test('Horizontal rule with spaces between asterisks', () => {
            expectSame('* * *');
        });
    
        test('Horizontal rule with spaces between underscores', () => {
            expectSame('_ _ _');
        });
    
        test('Horizontal rule with newline before ---', () => {
            expectSame('\n---');
        });
    
        test('Horizontal rule with newline after ---', () => {
            expectSame('---\n');
        });
    
        test('Horizontal rule surrounded by paragraphs', () => {
            expectSame('Paragraph before\n\n---\n\nParagraph after');
        });
    
        test('Horizontal rule with mixed case asterisks', () => {
            expectSame('*** ** **');
        });
    
        test('Horizontal rule with mixed case dashes', () => {
            expectSame('--- -- --');
        });
    
        test('Horizontal rule with newline and spaces after ---', () => {
            expectSame('---   \n\n');
        });
    
        test('Horizontal rule with multiple newlines before ---', () => {
            expectSame('\n\n\n---');
        });
    
        test('Invalid horizontal rule with letters', () => {
            expectSame('---a---'); // Should not be serialized as HR
        });
    
        test('Invalid horizontal rule with special characters', () => {
            expectSame('---$---'); // Should not be serialized as HR
        });
    
        test('Multiple horizontal rules', () => {
            expectSame('---\n\n***\n\n___'); // Should serialize as multiple HRs
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
            expectSame('paragraph 1.\n\t\nparagraph 2.');
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
    
        test('Line break with leading and trailing spaces', () => {
            expectSame('  Line with leading and trailing spaces  \nNext line.');
        });
    
        test('Line break with inline code', () => {
            expectSame('This is `inline code`  \nand a new line.');
        });
    
        test('Multiple consecutive line breaks with text', () => {
            expectSame('First line  \n  \n  \nFourth line');
        });
    
        test('Line break with italic text', () => {
            expectSame('*Italic text*  \nNew line');
        });
    
        test('Line break at both start and end', () => {
            expectSame('  \nLine with breaks around  \n');
        });
    
        test('Line break inside a heading', () => {
            expectSameTo('# Heading with break  \nNew line under heading', '# Heading with break\nNew line under heading');
        });
    
        test('Line break between links', () => {
            expectSame('[Link 1](https://example.com)  \n[Link 2](https://example.com)');
        });
    
        test('Line break before blockquote', () => {
            expectSame('Line before blockquote  \n> Blockquote starts here');
        });
    
        test('Multiple line breaks inside blockquote', () => {
            expectSame('> Line 1  \n>  \n> Line 3');
        });
    
        test('Line break with escaped characters', () => {
            expectSame('This is a backslash \\  \nand new line after');
        });
    
        test('Line break with mixed formatting', () => {
            expectSame('This is **bold**, *italic*, and a `code` span  \nNew line');
        });
    
        test('Multiple line breaks between paragraphs', () => {
            expectSame('Paragraph 1  \n  \nParagraph 2  \n  \nParagraph 3');
        });
    });
});

suite('MarkdownSerializer (inline-level)', () => {
    
    suite('em', () => {
        test('Basic emphasis with *', () => {
            expectSame('*This is emphasized*');
        });
    
        test('Basic emphasis with _', () => {
            expectSame('_This is emphasized_');
        });
    
        test('Emphasis in the middle of text', () => {
            expectSame('This is *emphasized* in the middle.');
        });
    
        test('Emphasis with special characters inside', () => {
            expectSame('*This is !@# emphasized*');
        });
    
        test('Emphasis with multiple spaces inside', () => {
            expectSame('*This   is   emphasized*');
        });
    
        test('Emphasis combined with bold', () => {
            expectSame('**This is bold and *emphasized* text**');
        });
    
        test('Emphasis with code inside', () => {
            expectSame('*Emphasized `code` inside*');
        });
    
        test('Emphasis with link inside', () => {
            expectSame('*This is [a link](https://example.com) inside*');
        });
    
        test('Emphasis at the beginning and end', () => {
            expectSame('*Emphasized* at the beginning and end *again*');
        });
    
        test('Multiple adjacent emphasized sections', () => {
            expectSame('*First* *Second* *Third*');
        });
    
        test('Nested emphasis', () => {
            expectSameTo('*This is *nested emphasis**', '*This is nested emphasis*'); // overlap, remove the nested unused one.
        });
    
        test('Emphasis across multiple lines (invalid)', () => {
            expectSame('This is *emphasized\nacross two lines*'); // Should not be serialized as valid emphasis
        });
    
        test('Invalid emphasis (single asterisk)', () => {
            expectSame('This is * invalid emphasis');
        });
    
        test('Invalid emphasis (unmatched asterisks)', () => {
            expectSame('*This is invalid emphasis');
        });
    
        // fix: see prosemirror discussion https://discuss.prosemirror.net/t/investigation-on-nested-marks-in-prosemirror/7828
        test.skip('Emphasis with nested emphasis', () => {
            expectSame('*This is *italic* text*');
        });

        // fix: see prosemirror discussion https://discuss.prosemirror.net/t/investigation-on-nested-marks-in-prosemirror/7828
        test.skip('Emphasis with mixed formatting and escape characters', () => {
            expectSame('*This is **bold**, *italic*, and \\*escaped\\* text*');
        });
    
        test('Emphasis with inline HTML tag', () => {
            expectSame('*Emphasis with <strong>HTML</strong> tag*');
        });
    
        test('Emphasis with self-closing HTML tag', () => {
            expectSame('*Emphasis with <img src="image.jpg" alt="img"/> inside*');
        });
    
        test('Emphasis with digits inside', () => {
            expectSame('*1234*');
        });
    
        test('Emphasis with underscores and digits inside', () => {
            expectSame('_1234_');
        });
    
        test('Emphasis with escape sequence', () => {
            expectSame('\\*This is not emphasized\\*');
        });
    
        test('Emphasis with empty content', () => {
            expectSame('**'); // Empty emphasis
        });
        
        test('Emphasis incomplete', () => {
            expectSame('_');
        });
    
        test('Emphasis surrounded by underscores and spaces', () => {
            expectSame('_ This should be emphasized _');
        });
    
        test('Emphasis with invalid characters around', () => {
            expectSame('*This is emphasized*text');
        });
    
        test('Emphasis with repeated underscores and spaces', () => {
            expectSame('_ This _ is _emphasized_ text _');
        });
    
        test('Emphasis with multiple underscores inside', () => {
            expectSame('_This_is_emphasized_text_');
        });
    
        test('Emphasis followed by punctuation', () => {
            expectSame('*This is emphasized*!');
        });
    
        test('Emphasis inside a heading', () => {
            expectSame('# Heading with *emphasized* text');
        });
    
        test('Emphasis with nested strong and links', () => {
            expectSame('*This is **bold** and [link](https://example.com) inside*');
        });
    
        test('Emphasis around parentheses and special characters', () => {
            expectSame('*This is (emphasized) text!*');
        });
    
        test('Emphasis with special characters at the start and end', () => {
            expectSame('This is *!emphasized!*');
        });
    });

    suite('strong', () => {
        test('Basic bold with **', () => {
            expectSame('**This is bold**');
        });
    
        test('Basic bold with __', () => {
            expectSame('__This is bold__');
        });
    
        test('Bold in the middle of text', () => {
            expectSame('This is **bold** in the middle.');
        });
    
        test('Bold with special characters inside', () => {
            expectSame('**This is !@#$%^&*() bold**');
        });
    
        test('Bold with multiple spaces inside', () => {
            expectSame('**This   is   bold**');
        });
    
        test('Bold with leading and trailing spaces', () => {
            expectSame('**   Bold with spaces   **');
        });
    
        test('Bold combined with emphasis', () => {
            expectSame('**This is bold and *emphasized* text**');
        });
    
        test('Bold with code inside', () => {
            expectSame('**Bold `code` inside**');
        });
    
        test('Bold with link inside', () => {
            expectSame('**This is [a link](https://example.com) inside**');
        });
    
        test('Bold at the beginning and end', () => {
            expectSame('**Bold** at the beginning and end **again**');
        });
    
        test('Multiple adjacent bold sections', () => {
            expectSame('**First** **Second** **Third**');
        });
    
        test('Nested bold and emphasis', () => {
            expectSame('**This is **nested *emphasis* bold**');
        });
    
        test('Invalid bold (single asterisk)', () => {
            expectSame('This is * invalid bold');
        });
    
        test('Invalid bold (unmatched asterisks)', () => {
            expectSame('**This is invalid bold');
        });
    
        // fix: see prosemirror discussion https://discuss.prosemirror.net/t/investigation-on-nested-marks-in-prosemirror/7828
        test.skip('Bold with mixed formatting and escape characters', () => {
            expectSame('**This is *italic*, **bold**, and \\*escaped\\* text**');
        });
    
        test('Bold with inline HTML tag', () => {
            expectSame('**Bold with <em>HTML</em> tag**');
        });
    
        test('Bold with self-closing HTML tag', () => {
            expectSame('**Bold with <img src="image.jpg" alt="img"/> inside**');
        });
    
        test('Bold with digits inside', () => {
            expectSame('**1234**');
        });
    
        test('Bold with underscores and digits inside', () => {
            expectSame('__1234__');
        });
    
        test('Bold with escape sequence', () => {
            expectSame('\\**This is not bold\\**');
        });
    
        test('Bold with empty content', () => {
            expectSame('****'); // Empty bold
        });
    
        test('Bold surrounded by underscores and spaces', () => {
            expectSame('__ This should be bold __');
        });
    
        test('Bold with invalid characters around', () => {
            expectSame('**This is bold**text');
        });
    
        test('Bold with repeated underscores and spaces', () => {
            expectSame('__ This __ is __bold__ text __');
        });
    
        test('Bold with multiple underscores inside', () => {
            expectSame('__This_is_bold_text__');
        });
    
        test('Bold followed by punctuation', () => {
            expectSame('**This is bold**!');
        });
    
        test('Bold inside a heading', () => {
            expectSame('# Heading with **bold** text');
        });

        test('Bold with nested emphasis and links', () => {
            expectSame('**This is *italic* and [link](https://example.com) inside**');
        });
    
        test('Bold around parentheses and special characters', () => {
            expectSame('**This is (bold) text!**');
        });
    
        test('Bold with special characters at the start and end', () => {
            expectSame('This is **!bold!**');
        });
    });
});