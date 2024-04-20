const path =  require('path');
const fs = require('fs');
const { ScriptHelper, ScriptProcess, Times, Git, Loggers } = require("../utility");



// script execution
run();



async function run() {
    ScriptHelper.init('codicon');

    // fetch the latest submodule
    const submodulePath = 'assets/codicons';
    await Git.Submodule.init(submodulePath, ['--remote']);

    // The path to read all the icons (.svg)
    const codiconRoot = './assets/codicons/icons';
    const outputRoot  = './src/base/browser/icon';
    const configPath = path.join(outputRoot, '.fantasticonrc.js');

    // set environment
    const envList = ScriptHelper.setEnv({
        inputDir: { defaultValue: codiconRoot },
        outputDir: { defaultValue: outputRoot },
    });

    // run codicon
    const codiconProc =  new ScriptProcess(
        'fantasticon',
        'fantasticon',
        ['-c', configPath],
        [],
        {
            env: process.env,
            cwd: process.cwd(),
            shell: true,
            logConfiguration: [
                ...envList
            ]
        }
    );
    codiconProc.proc.stdout.on('data', (output) => {
        process.stdout.write(`${Times.getTime()} ${output}`);
    });
    codiconProc.proc.stderr.on('data', (error) => {
        console.error(`${Times.getTime()} ${error}`);
    });
    try {
        await codiconProc.waiting();
    } catch (exitcode) {
        process.exit(exitcode);
    }

    // repairing the generated files (initial generated version does not work)
    await repair(outputRoot);
}

/**
 * @param {string} outputRoot 
 */
async function repair(outputRoot) {
    Loggers.print(`Start repairing the generated Icon Fonts at '${outputRoot}'...`);

    // icons.ts (replace with 'const enum' keyword)
    await (async function fixIconTs() {
        const fileName = 'icons.ts';
        Loggers.print(`Start repairing '${fileName}'...`);
        
        const expectedFirstLine = 'export enum Icons {';
        const revisedFirstLine = 'export const enum Icons {';
        const filePath = path.resolve(outputRoot, fileName);        
        const content = (await fs.promises.readFile(filePath)).toString();

        let firstLine = '';
        let i;
        for (i = 0; i < content.length; i++) {
            const c = content[i];
            if (c == '\n' || c == '\r') {
                break;
            }
            firstLine += c;
        }

        // if the first line is not what we expected, we do nothing.
        Loggers.print(`The first line of ${fileName} is '${firstLine}'.`);
        if (firstLine !== expectedFirstLine) {
            Loggers.print(`The first line is not the same as '${expectedFirstLine}' as expected. Thus we fix nothing for safety purpose.`);
            return;
        }

        Loggers.print(`The first line will be replace by '${revisedFirstLine}'`);
        while (content[i] == '\n' || content[i] == '\r') {
            i++;
        }

        const newContent = revisedFirstLine + '\n' + content.substring(i, undefined);
        await fs.promises.writeFile(filePath, newContent);
        Loggers.print(`✅ Repairing '${fileName}' completed.`);
    })();

    // icons.css (remove the postfix hexDecimal when loading the font file)
    await (async function fixIconCss() {
        const fileName = 'icons.css';
        Loggers.print(`Start repairing '${fileName}'...`);

        const filePath = path.resolve(outputRoot, fileName);
        const content = (await fs.promises.readFile(filePath)).toString();
        
        const regexp = /(url\("\.\/icons\.(ttf|woff|woff2))\?[^"]+/;
        const newContent = content.replace(regexp, '$1');
        
        await fs.promises.writeFile(filePath, newContent);
        Loggers.print(`✅ Repairing '${fileName}' completed.`);
    })();
}