const path = require('path');
const fs = require('fs');
var Benchmark = require('benchmark');

const marked = require('./modules/marked/marked.min');
const markdownit = new require('./modules/markdown-it/markdown-it.min')();

/*******************************************************************************
 * This ia a benchmark for testing how fast (also RAM usage) of each tokenizer 
 * compares to our own tokenizer. The comparing modules are:
 *  - marked
 *  - markdown-it
 ******************************************************************************/

// reads all the test cases name
const currTestPath = path.join(__dirname, 'test');
const suiteNames = (fs.readdirSync(currTestPath, { withFileTypes: true })
    .filter(source => source.isFile())
    .map(source => source.name)
);

// callbacks for suite
const onStart = (suiteName) => process.stdout.write(`\nSuite: ${suiteName}\n`);
const onComplete = () => process.stdout.write('\n');
const onCycle = (e) => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(' > ' + e.target);
};

// Run each suite on different markdown tokenizers.
for (const suiteName of suiteNames) {
    const filePath = path.join(currTestPath, suiteName);
    const fileText = fs.readFileSync(filePath, 'utf8');

    const suite = new Benchmark.Suite(suiteName, {
        onStart: () => onStart(suiteName),
        onComplete: onComplete
    });
    
    suite.add('marked', {
        onCycle: onCycle,
        onComplete: onComplete,
        fn: () => {
            marked.lexer(fileText);
        }
    });

    suite.add('markdown-it', {
        onCycle: onCycle,
        onComplete: onComplete,
        fn: () => {
            markdownit.parse(fileText, {});
        }
    });

    suite.run({ async: false });
}
