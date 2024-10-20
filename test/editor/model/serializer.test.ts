import * as assert from 'assert';
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

    function expectSame(content: string): void {
        const serializedContent = parseAndSerialize(content);
        assert.strictEqual(content, serializedContent);
    }
    
    function expectEqualTo(content: string, expect: string): void {
        const serializedContent = parseAndSerialize(content);
        assert.strictEqual(expect, serializedContent);
    }

    function parseAndSerialize(content: string): string {
        const tokens = lexer.lex(content);
        const doc = docParser.parse(tokens);
        const serializedContent = serializer.serialize(doc);
        return serializedContent;
    }

    test('Paragraph & text', () => {
        expectSame('Some paragraph.');
        expectSame('This is a multi-line paragraph.\nIt has two lines.');
        expectSame('\\');
        // expectSame('\\;'); // FIX
        // expectSame('!@#$%^&*()_+~=-[]{}\\|;:\'"<,>.?/'); // FIX
        

    
        // Paragraph with inline formatting (bold, italic, and code)
        // expectSame('This is a paragraph with **bold** text and *italic* text.');
        // expectSame('This is a paragraph with a `code span` in the middle.');
    
        // Paragraph with a link
        // expectSame('This is a paragraph with a [link](https://example.com).');
    
        // Paragraph with complex mixed inline marks
        // expectSame('This is **bold**, *italic*, and `code` in one paragraph.');
    
        // Paragraph with punctuation and mixed inline marks
        // expectSame('Here is a sentence with punctuation, **bold text**, and a [link](https://example.com).');
        
        // Complex paragraph with special characters and inline formatting
        // expectEqualTo('This paragraph includes special characters: **&**, *<*, `>` and `"quoted text"`, along with a [link](https://example.com).', 'This paragraph includes special characters: **&**, *<*, `>` and `"quoted text"`, along with a [link](https://example.com).');
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
            expectEqualTo('  ## Heading with spaces   ', '## Heading with spaces');
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

    test('html', () => {
        expectSame('<div></div>');
        expectSame('<div>hello world</div>');
        expectSame('<div style=\'font-family: "Comic Sans MS", "Comic Sans", cursive;\'>It is a pity, but markdown does **not** work in here for most markdown parsers.[Marked] handles it pretty well.</div>');
        expectSame('<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1r5SJvZE3c3LOLRJr3ZYtc?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>');
    });

    test('Image', () => {
        expectSame('![]()');
        expectSame('![](image.jpg)');
        expectSame('![alt text]()');
        expectSame('![alt text](image.jpg)');
        expectSame('![alt text](image.jpg "Image Title")');
        expectSame('![alt text](image%20with%20spaces.jpg)');
        expectSame('![alt text](image.jpg "Title with (parentheses)")');
        expectEqualTo('![alt text](image(withparentheses).jpg)', '![alt text](image\\(withparentheses\\).jpg)');
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
            expectEqualTo('  ---  ', '---');
        });
        
        test('With spaces before and after ***', () => {
            expectEqualTo('   ***   ', '***');
        });
        
        test('With spaces before and after ___', () => {
            expectEqualTo(' ___ ', '___');
        });
        
        test('Invalid horizontal rule (too few dashes)', () => {
            expectSame('--'); // Invalid HR, should not be serialized as HR
        });
        
        test('Invalid horizontal rule (mixed symbols)', () => {
            expectSame('-*-'); // Invalid HR, should not be serialized as HR
        });
    });
});