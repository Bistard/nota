const childProcess = require("child_process");
const path = require("path");
const fs = require('fs');
const { c, getTime, setCharAt, ifMissingFile } = require("./utility");

/**
 * The script is to remove all the prefix of every svg files that are downloaded 
 * from the website and regenerate the icon using `fantasticon`.
 * 
 * @note Icon library: https://www.flaticon.com/uicons/interface-icons
 */

run();

// remove prefix
async function run() {

    let count = 0;
    /**
     * 
     * @param {string} name 
     * @returns 
     */
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
        const root = './src/base/browser/icon';

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
            return;
        }

        console.log(`${getTime()} There are missing icon files: ${missingFiles.join(', ')}.`);
    }

    (function generateIcon() {
        const spawn = childProcess.spawn(
            'fantasticon -c src/base/browser/icon/.fantasticonrc.js', 
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
                process.stdout.write(`${getTime(c.FgRed)} child process exited with code ${code}`);
            } else {
                process.stdout.write(`${getTime(c.FgGreen)} Building success`);
            }

            if (fail) {
                process.exit(code);
            }
        });
    })();
};
// #endregion