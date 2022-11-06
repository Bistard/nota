const childProcess = require("child_process");
const minimist = require("minimist");
const path = require("path");
const fs = require('fs');
const { c, getTime, setCharAt, ifMissingFile } = require("./utility");

/**
 * The script is to remove all the prefix of every svg files that are downloaded 
 * from the website and regenerate the icon using `fantasticon`.
 * 
 * @note Icon library: https://www.flaticon.com/uicons/interface-icons
 */
console.log(`${getTime()} starting icon.js.`);


run();


async function run() {

    const root = './src/base/browser/icon';

    // command line argument
    const CLIArgv = minimist(process.argv.slice(2));
    console.log(`${getTime()} [script arguments]`, CLIArgv);
    
    /**
     * Either force to regenerate files or, check if any prefix need to remove 
     * or any missing icon files.
     */
    const needed = (CLIArgv.force == 'true') || await checkIfRegenerate(root);
    if (!needed) {
        return;
    }

    // actual regenerate icons
    await generateIcons(root);

    // repair generated typescript file
    await repair(root);
};

/**
 * @param {string} root The root path for the generated files.
 */
async function checkIfRegenerate(root) {
    let count = 0;
    const getName = (name) => {
        const parts = name.split('-');

        /**
         * Since the prefix has a form of `xx-xx-name.svg`. Instead of using `-` 
         * as a seperator, we use the Hungarian Notation.
         */
        if (parts.length >= 3) {
            const removedParts = parts.slice(2);
            
            // hungarian
            if (removedParts.length > 1) {
                for (let i = 1; i < removedParts.length; i++) {
                    removedParts[i] = setCharAt(removedParts[i], 0, removedParts[i][0].toUpperCase());
                }
            }

            return removedParts.join('');
        }

        // no prefix is detected.
        return parts.join('');
    };

    await (async function removePrefix() {
        console.log(`${getTime()} Removing prefix...`);

        const root = './assets/svg';
        const files = await fs.promises.readdir(root, { withFileTypes: true });
        for (const file of files) {
            
            if (!file.isFile()) {
                continue;
            }

            const oldName = file.name;
            const newName = getName(file.name);

            if (oldName === newName) {
                continue;
            }

            await fs.promises.rename(path.resolve(root, oldName), path.resolve(root, newName));
            count++;
        }
    })();

    if (count > 0) {
        console.log(`${getTime()} Total of ${count} files of prefix has been removed.`);
    }
    else {
        console.log(`${getTime()} There is no prefix to be removed.`);
        
        let missingFiles = [];

        const checkList = [
            'icons.css',
            'icons.ts',
            'icons.woff2'
        ];

        for (const name of checkList) {
            if (await ifMissingFile(root, name)) {
                missingFiles.push(name);
            }
        }
        
        if (missingFiles.length == 0) {
            console.log(`${getTime()} There is no missing icon files.`);
            return false;
        }

        console.log(`${getTime()} There are missing icon files: ${missingFiles.join(', ')}.`);
    }

    return true;
};

/**
 * @param {string} root The root path for the generated files.
 */
async function generateIcons(root) {

    let resolve;
    const promise = new Promise((res, rej) => { resolve = res; });

    const configPath = root + '/.fantasticonrc.js';
    const spawn = childProcess.spawn(
        `fantasticon -c ${configPath}`, 
        [], 
        {
            env: process.env,
            cwd: path.resolve(__dirname, '../'),
            shell: true,
        },
    );

    spawn.stdout.on('data', (output) => {
        process.stdout.write(`${getTime()} ${output}`);
    });
    
    spawn.stderr.on('data', (error) => {
        console.error(`${getTime()} ${error}`);
    });
    
    spawn.on('close', (code) => {
        let fail = false;
        
        if (code) {
            fail = true;
            console.log(`${getTime(c.FgRed)} child process exited with code ${code}`);
        } else {
            console.log(`${getTime(c.FgGreen)} Building success`);
        }

        if (fail) {
            process.exit(code);
        }

        resolve();
    });

    return promise;
};

/**
 * @param {string} root The root directory of the files.
 */
async function repair(root) {
    console.log(`${getTime()} start fixing generated icon files....`);

    const fixFileName = 'icons.ts';
    const expectedFirstLine = 'export enum Icons {';
    const revisedFirstLine = 'export const enum Icons {';
    const filePath = path.resolve(root, fixFileName);

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
    console.log(`${getTime()} The first line of ${fixFileName} is '${firstLine}'.`);
    if (firstLine !== expectedFirstLine) {
        console.log(`${getTime()} The first line is not the same as '${expectedFirstLine}' as expected. Thus we fix nothing for safety purpose.`);
        return;
    }

    console.log(`${getTime()} The first line will be replace by '${revisedFirstLine}'`);
    while (content[i] == '\n' || content[i] == '\r') {
        i++;
    }

    const newContent = revisedFirstLine + '\n' + content.substring(i, undefined);
    await fs.promises.writeFile(filePath, newContent);

    console.log(`${getTime()} Fix successfully.`);
}

// #endregion