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

    const srcRoot = './assets/svg';
    const outputRoot = './src/base/browser/icon';
    const codeRoot = './src';

    // command line argument
    const CLIArgv = minimist(process.argv.slice(2));
    console.log(`${getTime()} [script arguments]`, CLIArgv);
    
    /**
     * Either force to regenerate files or, check if any prefix need to remove 
     * or any missing target icon files.
     */
    const needed = (CLIArgv.force == 'true') || await checkIfRegenerate(outputRoot);
    if (!needed) {
        return;
    }

    // actual regenerate icons
    await generateIcons(srcRoot, outputRoot);

    // repair generated typescript file (fantasticon generated enum is not const).
    await repair(outputRoot);

    /**
     * To avoid generate the entire icon libraries, we need to scan the entire
     * code section and regenerate the icon files that does not contain any 
     * unused icons.
     */
    await reduceUnusedIcons(srcRoot, codeRoot, outputRoot);
};

//#region helper functions

/**
 * @param {string} outputRoot The root path for the generated files.
 */
async function checkIfRegenerate(outputRoot) {
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
            if (await ifMissingFile(outputRoot, name)) {
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
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} outputRoot The root path for the generated files.
 */
async function generateIcons(srcRoot, outputRoot) {

    let resolve;
    const promise = new Promise((res, rej) => { resolve = res; });
    process.env.inputDir = srcRoot;
    process.env.outputDir = outputRoot;

    const configPath = outputRoot + '/.fantasticonrc.js';
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
 * @param {string} outputRoot The root directory of the files.
 */
async function repair(outputRoot) {
    console.log(`${getTime()} start fixing generated icon files....`);

    const fixFileName = 'icons.ts';
    const expectedFirstLine = 'export enum Icons {';
    const revisedFirstLine = 'export const enum Icons {';
    const filePath = path.resolve(outputRoot, fixFileName);

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

//#region reduceUnusedIcons

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} codeRoot The root path of the resource of the entire code section.
 * @param {string} outputRoot The root path for the generated files.
 */
async function reduceUnusedIcons(srcRoot, codeRoot, outputRoot) {
    console.log(`${getTime()} Start removing unsed icons...`);

    // create a temporary directory to store all the used icon svg
    const tempRoot = path.resolve(srcRoot, 'temp');
    try {
        await fs.promises.rm(tempRoot, { force: true, recursive: true });
    } catch {}
    await fs.promises.mkdir(tempRoot);

    // scans the used icons and copy each used icon file into the temporary root path
    await scanUsedIcons(srcRoot, codeRoot, tempRoot);

    // regenerate icons from the tempRoot
    console.log(`${getTime()} Start regenerating used icons...`);
    await generateIcons(tempRoot, outputRoot);
    console.log(`${getTime()} Start regeneration finished.`);

    // repair generated typescript file
    await repair(outputRoot);

    // clean up
    console.log(`${getTime()} Cleanning temporary icon files....`);
    await fs.promises.rm(tempRoot, {force: true, recursive: true});
    console.log(`${getTime()} Cleanning finished.`);
}

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} codeRoot The root path of the resource of the entire code section.
 * @param {string} tempRoot The temporary root path of the resource of the icons.
 */
async function scanUsedIcons(srcRoot, codeRoot, tempRoot) {
    
    /**
     * Finds out all the icons first. These icon names should has a hanguarain 
     * notaion. Such as xxxYyyZzz or xxx. We need to convert them to XxxYyyZzz 
     * or Xxx.
     */
    const allIcons = 
        (await fs.promises.readdir(srcRoot, { withFileTypes: true }))
        .filter(target => target.isFile())
        .map(target => path.parse(target.name).name)
        .map(name => setCharAt(name, 0, name[0].toUpperCase()))
    ;
    console.log(`${getTime()} There are total of ${allIcons.length} of valid icons.`);
    
    /**
     * Create the regular expression based on all the icons we have.
     * Then we read through the entire code section to store all the icons that
     * are used.
     */
    const regexp = new RegExp(`\\bIcons\\.(${allIcons.join('|')})\\b`, 'g');
    const usedIcons = new Set();
    
    // callback for every directory
    console.log(`${getTime()} Start scanning repository at '${codeRoot}'...`);
    const scan = async (parentPath) => {
        const targets = await fs.promises.readdir(parentPath, { withFileTypes: true });
        
        for (const target of targets) {
            const currPath = path.resolve(parentPath, target.name);
            
            if (target.isFile()) {
                const content = (await fs.promises.readFile(currPath)).toString();
                let result = content.matchAll(regexp);
                for (const res of result) {
                    const usedIcon = res[1];
                    usedIcons.add(usedIcon);
                }
            }
            else {
                await scan(currPath);
            }
        }
    };
    await scan(codeRoot);
    console.log(`${getTime()} Scanning ended.`);
    console.log(`${getTime()} Detected total of ${usedIcons.size} of used icons in the code section.`);
    
    
    /**
     * Loop all the icons again and copy all the used icons into the temp 
     * directory.
     */
    for (const icon of allIcons) {
        if (usedIcons.has(icon)) {
            lowerCaseIcon = setCharAt(icon, 0, icon[0].toLowerCase()) + '.svg';
            await fs.promises.copyFile(path.resolve(srcRoot, lowerCaseIcon), path.resolve(tempRoot, lowerCaseIcon));
        }
    }
}

//#endregion