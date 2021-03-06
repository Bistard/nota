// import * as assert from 'assert';
// import { Markdown } from 'src/editor/common/markdown';
// import { MarkdownLexer } from 'src/editor/model/markdown/lexer';

// const tokenNameMap = [
//     'unknown', 'space', 'code', 'heading', 'table', 'hr', 'blockquote', 'list', 
//     'list item', 'paragraph', 'html', 'text', 'def', 'escape', 'tag', 'link', 
//     'image', 'strong', 'em', 'codespan', 'br', 'del', 'generic'
// ];

// // time complexity: O(n)
// function dfs(token: Markdown.Token, fn: (token: Markdown.Token) => void): void {
//     if ((token as any).tokens) {
//         for (const child of (token as any).tokens) {
//             dfs(child, fn);
//         }
//     }
//     fn(token);
// }

// function assertTokens(text: string, expectTokens: Markdown.Token[], print?: boolean): void {
//     const lexer = new MarkdownLexer();
//     const actualTokens = lexer.lex(text);

//     actualTokens.forEach(token => dfs(token, (token) => {
//         (token.type as any) = tokenNameMap[token.type]!;
//         (token as any)._text = text.substring(token.startIndex, token.startIndex + token.textLength);
//     }));

//     if (print === true) {
//         console.log(JSON.stringify(actualTokens, null, 4));
//     }

//     // assert.deepStrictEqual(actualTokens, expectTokens);
// }

// suite('lexer-test', () => {

//     test('paragraph', () => {
//         assertTokens('Hello\nWorld!', [
//             // todo
//         ]);
//     });

//     test('space', () => {
//         assertTokens('Hello\n\nWorld!  \n', [
//             // todo
//         ]);
//     });

//     test('indent code', () => {
//         assertTokens('    code', [
//             // todo
//         ]);
//     });

//     test('fench code', () => {
//         assertTokens('```cpp\ncode\n```', [
//             // todo
//         ]);
//     });

//     test('heading', () => {
//         assertTokens('# heading 1\n\n## heading 2\n\n### heading 3\n\n#### heading 4\n\n##### heading 5\n\n###### heading 6', [
//             // TODO
//         ]);
//     });

//     test('hr', () => {
//         assertTokens('---', [
//             // TODO
//         ]);
//     });

//     test('blockquote', () => {
//         assertTokens('> blockquote1\n> blockquote2\n> blockquote3\n> blockquote4', [
//             // TODO
//         ]);
//     });

//     test('list', () => {
//         assertTokens('', [
//             // TODO
//         ]);
//     });

//     test('html - basic', () => {
//         assertTokens('<div>html</div>', [
//             // TODO
//         ]);
//     });

//     test('html - prev', () => {
//         assertTokens('<pre>html</pre>', [
//             // TODO
//         ]);
//     });

// });