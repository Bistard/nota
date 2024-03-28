const childProcess = require("child_process");
const minimist = require("minimist");
const path = require("path");
const fs = require('fs');
const utils = require("../utility");



// script execution
run();


async function run() {
    console.log(`${utils.getTime(utils.c.FgGreen)} Running 'icon.js'.`);

    const srcSvgRoot = './assets/svg';
    const outputRoot = './src/base/browser/icon';
    const codeRoot = './src';

    // command line argument
    const CLIArgv = minimist(process.argv.slice(2));
    console.log(`${utils.getTime()} [script arguments]`, CLIArgv);
    
    // obtain original svg file directory path
    const originalSvgRoot = path.resolve(CLIArgv._[0] || './assets/src-svg');
    if (!path.isAbsolute(originalSvgRoot)) {
        console.error(`${utils.getTime(utils.c.FgRed)} Missing argument <path>.`);
        process.exit(1);
    }

    // remove prefix given the path
    if (CLIArgv.removePrefix) {
        await removePrefix(originalSvgRoot);
        return;
    }
    
    /**
     * Either:
     *      - force to regenerate files, 
     *      - any extra icons is required,
     *      - any missing target icon files.
     */
    const force = (CLIArgv.force == 'true' || CLIArgv.force === true || CLIArgv.f === true);
    const extraIcons = CLIArgv.extra?.split(':') ?? [];
    const required = force || (extraIcons.length > 0) || await checkIfMissingTargetFiles(outputRoot);
    if (!required) {
        return;
    }
    
    // scans all the valid icons
    const allValidIcons = await obtainAllValidIcons(originalSvgRoot);
    
    // scans all the required icons
    const requiredIcons = await scanCodeForRequiredIcons(codeRoot, extraIcons);

    // clean up 'srcSvgRoot' for unrequired icons
    await cleanupUnrequiredIcons(srcSvgRoot, requiredIcons);
    
    // copy required svg icon files into srcSvgRoot
    await copyRequiredIcons(originalSvgRoot, srcSvgRoot, allValidIcons, requiredIcons);

    // regenerate icon font
    await generateIconFont(srcSvgRoot, outputRoot).then(() => console.log(`${utils.getTime(utils.c.FgGreen)} Creation of Font Icon finished.`));
    
    // repair generated typescript file
    await repair(outputRoot);

    console.log(`${utils.getTime(utils.c.FgGreen)} 'icon.js' completed.`);
};

async function checkIfMissingTargetFiles(outputRoot) {
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
    return true;
}

async function removePrefix(srcRoot) {    
    let count = 0;
    
    await (async function removePrefix() {
        console.log(`${utils.getTime()} Removing prefix at ${srcRoot}...`);

        const convertNameToHungarian = (name) => {
            const parts = name.split('-');
    
            /**
             * Since the prefix of each svg file has a form of `xx-xx-name.svg`. 
             * Instead of using `-` as a separator, we replace it with the Hungarian
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

        
        // try to find original svg files from srcRoot.
        let files;
        try {
            files = await fs.promises.readdir(srcRoot, { withFileTypes: true });
        } catch (err) {
            console.log(`${utils.getTime()} ${srcRoot} not found.`);
            return;
        }

        // loop all the found svg files and replace the names with the Hungarian Notation
        for (const file of files) {
            
            if (!file.isFile()) {
                continue;
            }

            const oldName = file.name;
            const newName = convertNameToHungarian(file.name);

            if (oldName === newName) {
                continue;
            }

            await fs.promises.rename(path.resolve(srcRoot, oldName), path.resolve(srcRoot, newName));
            count++;
        }
    })();

    console.log(`${utils.getTime()} Total of ${count} files of prefix has been removed.`);
    return true;
};

async function obtainAllValidIcons(svgRoot) {
    console.log(`${utils.getTime()} Scanning valid icon files at '${svgRoot}'...`);
    /**
     * Finds out all the possible icon names first. These icon names should has 
     * a hanguarain notaion. Such as xxxYyyZzz or xxx. We need to convert them 
     * to XxxYyyZzz or Xxx.
     */
    let allValidIcons = [];
    try {
        allValidIcons = 
            (await fs.promises.readdir(svgRoot, { withFileTypes: true }))
            .filter(target => target.isFile())
            .map(target => path.parse(target.name).name)
            .map(name => utils.setCharAt(name, 0, name[0].toUpperCase()))
        ;
    } catch (err) {
        // svgRoot does not exists, we ignore it.
    }
    console.log(`${utils.getTime()} There are total of ${allValidIcons.length} of valid icon files found at '${svgRoot}'.`);

    return allValidIcons;
}

async function scanCodeForRequiredIcons(codeRoot, extraIcons) {
    
    console.log(`${utils.getTime()} Start scanning repository at '${codeRoot}' for required icons...`);

    const regexp = new RegExp(`Icons\\.\\w+`, 'g');
    const requiredIcons = new Set();
    
    // put extra icons first if provided any
    for (const extraIcon of extraIcons) {
        requiredIcons.add(extraIcon);
    }

    /**
     * callback for every directory, iterate every files in the `codeRoot` and
     * searching for any using icon names.
     */
    const scan = async (parentPath) => {
        const targets = await fs.promises.readdir(parentPath, { withFileTypes: true });
        
        for (const target of targets) {
            const currPath = path.resolve(parentPath, target.name);
            
            if (!target.isFile()) {
                await scan(currPath);
                continue;
            }

            const content = (await fs.promises.readFile(currPath)).toString();
            const result = content.match(regexp);
            for (const usedIcon of result ?? []) {
                const iconName = usedIcon.split('.')[1];
                requiredIcons.add(iconName);
                console.log(`${utils.getTime()} Found required icon at ${currPath}: '${iconName}'.`);
            }
        }
    };
    
    await scan(codeRoot);
    console.log(`${utils.getTime()} Detected total of ${requiredIcons.size} of required icons at the repository '${codeRoot}'.`);

    return requiredIcons;
}

async function cleanupUnrequiredIcons(srcSvgRoot, requiredIcons) {

    // make sure `srcSvgRoot` exists
    const missingDir = await utils.ifMissingFile(srcSvgRoot, '');
    if (missingDir) {
        await fs.promises.mkdir(srcSvgRoot, { recursive: true });
        return;
    }

    // check existed `srcSvgRoot`, if contains any unrequired icons, we remove it.
    const existedIcons = await fs.promises.readdir(srcSvgRoot, { withFileTypes: true });
    for (const existedIcon of existedIcons) {
        
        // if not a target file, we notify it.
        if (!existedIcon.isFile() || path.extname(existedIcon.name) !== '.svg') {
            console.log(`${utils.getTime(utils.c.FgYellow)} Unexpected target founded at ${srcSvgRoot}: '${existedIcon.name}'.`);
            continue;
        }

        const rawName = path.parse(existedIcon.name).name; // without extension
        const upperRawName = utils.setCharAt(rawName, 0, rawName[0].toUpperCase());

        // target file, but not required, we delete it.
        if (!requiredIcons.has(upperRawName)) {
            console.log(`${utils.getTime(utils.c.FgYellow)} Deleting unrequired icon file founded at ${srcSvgRoot}: '${existedIcon.name}'...`);
            await fs.promises.rm(path.resolve(srcSvgRoot, existedIcon.name));
            continue;
        }
    }
}

async function copyRequiredIcons(srcRoot, outputRoot, allValidIcons, requiredIcons) {
    console.log(`${utils.getTime()} Trying to copy a total of ${requiredIcons.size} of required icons from '${srcRoot}' into '${outputRoot}'...`);
    
    for (const validIcon of allValidIcons) {
        if (requiredIcons.has(validIcon)) {
            lowerCaseIcon = utils.setCharAt(validIcon, 0, validIcon[0].toLowerCase()) + '.svg';
            await fs.promises.copyFile(path.resolve(srcRoot, lowerCaseIcon), path.resolve(outputRoot, lowerCaseIcon));
            requiredIcons.delete(validIcon);
        }
    }

    if (requiredIcons.size > 0) {
        process.stdout.write(`${utils.getTime(utils.c.FgRed)} Detected total of ${requiredIcons.size} of not founded icons.\n`);
        process.stdout.write('They are: ' + Array.from(requiredIcons.values()).join(',') + '.\n');
    } else {
        console.log(`${utils.getTime()} All required icons are founded the corresponding original svg files.`);
    }
}

async function generateIconFont(srcRoot, outputRoot) {
    console.log(`${utils.getTime()} Start creating Icon Font at '${srcRoot}' using Fantasticon...`);

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
            cwd: process.cwd(),
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
        if (code) {
            process.exit(code);
        }
        resolve();
    });

    return promise;
};

async function repair(outputRoot) {
    console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated Icon Fonts at '${outputRoot}'...`);

    // icons.ts
    await (async function fixIconTs() {
        const fileName = 'icons.ts';
        const expectedFirstLine = 'export enum Icons {';
        const revisedFirstLine = 'export const enum Icons {';
        const filePath = path.resolve(outputRoot, fileName);
        
        console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated file '${fileName}'...`);

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
    })();

    // icons.css
    await (async function fixIconCss() {
        const fileName = 'icons.css';
        const filePath = path.resolve(outputRoot, fileName);
        const content = (await fs.promises.readFile(filePath)).toString();
        
        console.log(`${utils.getTime(utils.c.FgGreen)} start fixing the generated file ${fileName}...`);
        
        const regexp = /(url\("\.\/icons\.woff2)\?[^"]+/;
        const newContent = content.replace(regexp, '$1');
        
        await fs.promises.writeFile(filePath, newContent);
    })();

    console.log(`${utils.getTime(utils.c.FgGreen)} Fix successfully.`);
}