const path = require("path");
const fs = require('fs');
const minimist = require("minimist");
const childProcess = require("child_process");

const _perfRecord = [];

const utils = new (class UtilCollection {
   
    // predefined color
    c = {
        Reset: "\x1b[0m",
        Gray: "\x1b[90m",
        Bright: "\x1b[1m",
        Dim: "\x1b[2m",
        Underscore: "\x1b[4m",
        Blink: "\x1b[5m",
        Reverse: "\x1b[7m",
        Hidden: "\x1b[8m",
    
        FgBlack: "\x1b[30m",
        FgRed: "\x1b[31m",
        FgGreen: "\x1b[32m",
        FgYellow: "\x1b[33m",
        FgBlue: "\x1b[34m",
        FgMagenta: "\x1b[35m",
        FgCyan: "\x1b[36m",
        FgWhite: "\x1b[37m",
    
        BgBlack: "\x1b[40m",
        BgRed: "\x1b[41m",
        BgGreen: "\x1b[42m",
        BgYellow: "\x1b[43m",
        BgBlue: "\x1b[44m",
        BgMagenta: "\x1b[45m",
        BgCyan: "\x1b[46m",
        BgWhite: "\x1b[47m",
    };

    constructor() {}

    /**
     * @description Returns the current time in a standard format.
     * @example 2022-08-24 00:33:58.226
     */
    getCurrTimeStamp() {
        const currentTime = new Date();
        return `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')} ${(currentTime.getHours()).toString().padStart(2, '0')}:${(currentTime.getMinutes()).toString().padStart(2, '0')}:${(currentTime.getSeconds()).toString().padStart(2, '0')}.${(currentTime.getMilliseconds()).toString().padStart(3, '0')}`;
    }

    /**
     * @description Parses the command line interface of the current script.
     * @returns Returning an object that contains all the command line 
     * arguments. Already processed by minimist.
     * 
     * @example
     * ```
     * > node ./scripts/script.js "a" "-b" "--c=d" "---e"
     * { _: [ 'a' ], b: true, c: 'd', '-e': true }
     * ```
     */
    parseCLI() {
        const CLIArgv = minimist(process.argv.slice(2));
        return CLIArgv;
    }

    color(color, text) {
        return `${color}${text}\x1b[0m`;
    }

    getTime(color) {
        if (!color) {
            return `${this.c.Gray}[${this.getCurrTimeStamp()}]\x1b[0m`;
        }
        return `${color}[${this.getCurrTimeStamp()}]\x1b[0m`;
    }

    perf(stage) {
        _perfRecord.push(stage, Date.now());
    }

    getPerf() {
        const marks = [];
        let i = 0;
        for (i = 0; i < _perfRecord.length; i += 2) {
            marks.push({
                stage: _perfRecord[i],
                time: _perfRecord[i + 1],
            });
        }
        return marks;
    }

    setCharAt(str, index, c) {
        if(index > str.length - 1) {
            return str;
        }
        return str.substring(0, index) + c + str.substring(index + 1);
    }

    async ifMissingFile(root, name) {
        try {
            await fs.promises.stat(path.resolve(root, name));
            return false;
        } catch {
            return true;
        }
    }

    async spawnChildProcess(command, args, opts) {
        return new Promise((res, rej) => {
            const proc = childProcess.spawn(command, args ?? [], opts ?? {});
            
            proc.on('close', (code) => {
                let fail = false;
                
                if (code) {
                    fail = true;
                    process.stdout.write(`${utils.getTime(utils.c.FgRed)} child process exited with error code ${code}`);
                }
                
                if (fail) {
                    rej(code);
                } else {
                    res(0);
                }
            });
        });
    }
});

// export
module.exports = utils;