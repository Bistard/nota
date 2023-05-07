const childProcess = require("child_process");
const minimist = require("minimist");
const path = require("path");
const fs = require('fs');
const utils = require("./utility");

/**
 * @description
 * The script is to remove all the prefix of every svg files that are downloaded 
 * from the website and regenerate the icon from svg into font file using 
 * `fantasticon`.
 * 
 * @note Icon library: https://www.flaticon.com/uicons/interface-icons
 * 
 * @option
 * The options of the script are listed below:
 * 
 * I. Force the script to regenerate icon files even there is no changes or 
 * missing target files.
 *      --force=true
 * 
 * II.  A way to manually add extra icons even the code section does not use it 
 * yet. The caller should provide a list of icon file names seperated by '|'. 
 * Each name should be in Hanguarian Notation except that the first character 
 * should also be capitalized.
 *      --extra=NewIconName1|NewIconName2
 */

run();

async function run() {
    console.log(`${utils.getTime(utils.c.FgGreen)} Running icon.js.`);

    const srcRoot = './assets/src-svg';
    const outputRoot = './src/base/browser/icon';
    const codeRoot = './src';

    // command line argument
    const CLIArgv = minimist(process.argv.slice(2));
    console.log(`${utils.getTime()} [script arguments]`, CLIArgv);
    const force = (CLIArgv.force == 'true');
    const extraIcons = CLIArgv.extra?.split(':') ?? [];
    
    /**
     * Either:
     *      - force to regenerate files, 
     *      - any extra icons is required,
     *      - check if any prefix need to remove,
     *      - any missing target icon files.
     */
    const needed = force || (extraIcons.length > 0) || await checkIfRegenerate(srcRoot, outputRoot);
    if (!needed) {
        return;
    }

    /**
     * To avoid generate the entire icon libraries, we need to scan the entire
     * code section and regenerate the icon files that does not contain any 
     * unused icons.
     */
    await reduceUnusedIcons(srcRoot, codeRoot, outputRoot, extraIcons);
};

//#region helper functions

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} outputRoot The root path for the generated files.
 */
async function checkIfRegenerate(srcRoot, outputRoot) {
    
    let count = 0;
    const getName = (name) => {
        const parts = name.split('-');

        /**
         * Since the prefix of each svg file has a form of `xx-xx-name.svg`. 
         * Instead of using `-` as a seperator, we replace it with the Hungarian
         * Notation.
         */
        if (parts.length >= 3) {
            const removedParts = parts.slice(2);
            
            // hungarian
            if (removedParts.length > 1) {
                for (let i = 1; i < removedParts.length; i++) {
                    removedParts[i] = utils.setCharAt(removedParts[i], 0, removedParts[i][0].toUpperCase());
                }
            }

            return removedParts.join('');
        }

        // no prefix is detected.
        return parts.join('');
    };

    await (async function removePrefix() {
        console.log(`${utils.getTime()} Removing prefix...`);

        let files;
        try {
            files = await fs.promises.readdir(srcRoot, { withFileTypes: true });
        } catch (err) {
            console.log(`${utils.getTime()} ${srcRoot} not found.`);
            return;
        }

        for (const file of files) {
            
            if (!file.isFile()) {
                continue;
            }

            const oldName = file.name;
            const newName = getName(file.name);

            if (oldName === newName) {
                continue;
            }

            await fs.promises.rename(path.resolve(srcRoot, oldName), path.resolve(srcRoot, newName));
            count++;
        }
    })();

    if (count > 0) {
        console.log(`${utils.getTime()} Total of ${count} files of prefix has been removed.`);
    }
    else {
        console.log(`${utils.getTime()} There is no prefix to be removed.`);
        
        let missingFiles = [];

        const checkList = [
            'icons.css',
            'icons.ts',
            'icons.woff2'
        ];

        for (const name of checkList) {
            if (await utils.ifMissingFile(outputRoot, name)) {
                missingFiles.push(name);
            }
        }
        
        if (missingFiles.length == 0) {
            console.log(`${utils.getTime()} There is no missing icon files.`);
            return false;
        }

        console.log(`${utils.getTime()} There are missing icon files: ${missingFiles.join(', ')}.`);
    }

    return true;
};

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} outputRoot The root path for the generated files.
 */
async function generateIcons(srcRoot, outputRoot) {
    console.log(`${utils.getTime()} Start creating Icon Font at ${srcRoot} using Fantasticon...`);

    let resolve;
    const promise = new Promise((res, rej) => { resolve = res; });
    process.env.inputDir = srcRoot;
    process.env.outputDir = outputRoot;

    const configPath = path.join(outputRoot, '.fantasticonrc.js');
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
        process.stdout.write(`${utils.getTime()} ${output}`);
    });
    
    spawn.stderr.on('data', (error) => {
        console.error(`${utils.getTime()} ${error}`);
    });
    
    spawn.on('close', (code) => {
        let fail = false;
        
        if (code) {
            fail = true;
            console.log(`${utils.getTime(utils.c.FgRed)} child process exited with code ${code}`);
        } else {
            console.log(`${utils.getTime(utils.c.FgGreen)} Building success`);
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
    console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated Icon Fonts at ${outputRoot}...`);

    // icons.ts
    {
        const fileName = 'icons.ts';
        const expectedFirstLine = 'export enum Icons {';
        const revisedFirstLine = 'export const enum Icons {';
        const filePath = path.resolve(outputRoot, fileName);
        
        console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated file ${fileName}...`);

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
        console.log(`${utils.getTime()} The first line of ${fileName} is '${firstLine}'.`);
        if (firstLine !== expectedFirstLine) {
            console.log(`${utils.getTime()} The first line is not the same as '${expectedFirstLine}' as expected. Thus we fix nothing for safety purpose.`);
            return;
        }

        console.log(`${utils.getTime()} The first line will be replace by '${revisedFirstLine}'`);
        while (content[i] == '\n' || content[i] == '\r') {
            i++;
        }

        const newContent = revisedFirstLine + '\n' + content.substring(i, undefined);
        await fs.promises.writeFile(filePath, newContent);
    }

    // icons.css
    {
        const fileName = 'icons.css';
        const filePath = path.resolve(outputRoot, fileName);
        const content = (await fs.promises.readFile(filePath)).toString();
        
        console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated file ${fileName}...`);
        
        const regexp = /(url\("\.\/icons\.woff2)\?[^"]+/;
        const newContent = content.replace(regexp, '$1');
        
        await fs.promises.writeFile(filePath, newContent);
    }

    console.log(`${utils.getTime(utils.c.FgGreen)} Fix successfully.`);
}

// #endregion

//#region reduceUnusedIcons

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} codeRoot The root path of the resource of the entire code section.
 * @param {string} outputRoot The root path for the generated files.
 * @param {string[]} extraIcons An array of string that contains the extra icons.
 * for usage.
 */
async function reduceUnusedIcons(srcRoot, codeRoot, outputRoot, extraIcons) {
    
    console.log(`${utils.getTime(utils.c.FgGreen)} Start removing unused icons...`);
    const svgRoot = path.resolve(srcRoot, './../svg');

    // clean up
    // TODO: clean up unused icons

    // scans the used icons and copy each used icon file into the temporary root path
    await scanUsedIcons(srcRoot, codeRoot, svgRoot, extraIcons);

    // regenerate icons from the svgRoot
    await generateIcons(svgRoot, outputRoot);
    console.log(`${utils.getTime(utils.c.FgGreen)} Creation of Font Icon finished.`);
    
    // repair generated typescript file
    await repair(outputRoot);
}

/**
 * @param {string} srcRoot The root path of the resource of the icons.
 * @param {string} codeRoot The root path of the resource of the entire code section.
 * @param {string} outputRoot The output path of the required resource of the icons.
 * @param {string[]} extraIcons An array of string that contains the extra icons.
 */
async function scanUsedIcons(srcRoot, codeRoot, outputRoot, extraIcons) {
    
    /**
     * Finds out all the possible icon names first. These icon names should has 
     * a hanguarain notaion. Such as xxxYyyZzz or xxx. We need to convert them 
     * to XxxYyyZzz or Xxx.
     */
    const allIcons = 
        (await fs.promises.readdir(srcRoot, { withFileTypes: true }))
        .filter(target => target.isFile())
        .map(target => path.parse(target.name).name)
        .map(name => utils.setCharAt(name, 0, name[0].toUpperCase()))
    ;
    console.log(`${utils.getTime()} There are total of ${allIcons.length} of valid icon files found at ${srcRoot}.`);
    
    /**
     * Create the regular expression based on all the icons we have.
     * Then we read through the entire code section to store all the icons that
     * are used.
     */
    const regexp = new RegExp(`\\bIcons\\.(${allIcons.join('|')})\\b`, 'g');
    const usedIcons = new Set();
    
    // put extra icons first if provided any
    for (const extraIcon of extraIcons) {
        usedIcons.add(extraIcon);
    }

    /**
     * callback for every directory, iterate every files in the `codeRoot` and
     * searching for any using
     */
    console.log(`${utils.getTime()} Start scanning repository at '${codeRoot}' for used icons...`);
    const scan = async (parentPath) => {
        const targets = await fs.promises.readdir(parentPath, { withFileTypes: true });
        
        for (const target of targets) {
            const currPath = path.resolve(parentPath, target.name);
            
            if (target.isFile()) {
                const content = (await fs.promises.readFile(currPath)).toString();
                const result = content.matchAll(regexp);
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
    console.log(`${utils.getTime()} Detected total of ${usedIcons.size} of already used icons at the repository ${codeRoot}.`);
    
    /**
     * Loop all the icons again and copy all the used icons into the output 
     * directory.
     */
    await copyUsedIconsForTracking(srcRoot, outputRoot, allIcons, usedIcons);
}

async function copyUsedIconsForTracking(srcRoot, outputRoot, allIcons, usedIcons) {
    
    console.log(`${utils.getTime()} Copying total of ${usedIcons.size} of already used icons into ${outputRoot}...`);
    
    for (const icon of allIcons) {
        if (usedIcons.has(icon)) {
            lowerCaseIcon = utils.setCharAt(icon, 0, icon[0].toLowerCase()) + '.svg';
            await fs.promises.copyFile(path.resolve(srcRoot, lowerCaseIcon), path.resolve(outputRoot, lowerCaseIcon));
            usedIcons.delete(icon);
        }
    }

    process.stdout.write(`${utils.getTime(utils.c.FgRed)} Detected total of ${usedIcons.size} of untracked icons.\n`);
    if (usedIcons.size > 0) {
        process.stdout.write('They are: ' + Array.from(usedIcons.values()).join(',') + '.\n');
    }
}

//#endregion