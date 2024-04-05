const path = require("path");
const fs = require('fs');
const minimist = require("minimist");
const childProcess = require("child_process");

const _perfRecord = [];

/**
 * ANSI escape color codes for foreground color.
 */
const fgColor = {
    Reset: '\x1b[39m',
	Black: '\x1b[30m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
	LightGray: '\x1b[90m',
    LightRed: '\x1b[91m',
    LightGreen: '\x1b[92m',
    LightYellow: '\x1b[93m',
    LightBlue: '\x1b[94m',
    LightMagenta: '\x1b[95m',
    LightCyan: '\x1b[96m',
    LightWhite: '\x1b[97m',
}

/**
 * ANSI escape color codes for background color.
 */
const bgColor = {
    Reset: '\x1b[49m',
	Black: '\x1b[40m',
    Red: '\x1b[41m',
    Green: '\x1b[42m',
    Yellow: '\x1b[43m',
    Blue: '\x1b[44m',
    Magenta: '\x1b[45m',
    Cyan: '\x1b[46m',
    White: '\x1b[47m',
    LightGray: '\x1b[100m',
    LightRed: '\x1b[101m',
    LightGreen: '\x1b[102m',
    LightYellow: '\x1b[103m',
    LightBlue: '\x1b[104m',
    LightMagenta: '\x1b[105m',
    LightCyan: '\x1b[106m',
    LightWhite: '\x1b[107m',
}

class Colors {
	
    /**
	 * @param {string} text The text to be colored.
	 * @param {string} bgColor The ANSI background color code to set for the text.
	 * @param {string} fgColor The ANSI foreground color code to set for the text.
	 */
	static setANSIColor(text, fgColor, bgColor) {
		return `${fgColor ?? ''}${bgColor ?? ''}${text}\x1b[0m`;
	}

	/**
	 * @param {string} text The text to be colored.
     * @param {number} r 
     * @param {number} g
     * @param {number} b 
	 */
	static setRGBColor(text, r, g, b) {
		return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
	}

    static green(text) {
        return `${fgColor.Green}${text}\x1b[0m`;
    }
    
    static red(text) {
        return `${fgColor.Red}${text}\x1b[0m`;
    }
    
    static yellow(text) {
        return `${fgColor.Yellow}${text}\x1b[0m`;
    }
    
    static gray(text) {
        return `${fgColor.LightGray}${text}\x1b[0m`;
    }
}

class Times {

    /**
     * @description Get the time in string format with the given color.
     * @param {string} color 
     * @example [16:04:08]
     */
    static getTime(color) {
        return color
            ? `${color}[${this.getSimpleCurrTimeStamp()}]\x1b[0m`
            : `${fgColor.LightGray}[${this.getSimpleCurrTimeStamp()}]\x1b[0m`;
    }

    /**
     * @example 2024-04-04 16:04:08.910
     */
    static getCurrTimeStamp() {
        const currentTime = new Date();
        return `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, '0')}-${currentTime.getDate().toString().padStart(2, '0')} ${(currentTime.getHours()).toString().padStart(2, '0')}:${(currentTime.getMinutes()).toString().padStart(2, '0')}:${(currentTime.getSeconds()).toString().padStart(2, '0')}.${(currentTime.getMilliseconds()).toString().padStart(3, '0')}`;
    }

    /**
     * @example 16:04:08
     */
    static getSimpleCurrTimeStamp() {
        const currentTime = new Date();
        return `${(currentTime.getHours()).toString().padStart(2, '0')}:${(currentTime.getMinutes()).toString().padStart(2, '0')}:${(currentTime.getSeconds()).toString().padStart(2, '0')}`;
    }
}

class Loggers {

    /**
     * @description Print the given text with the color (if provided) with a 
     * time prefix.
     * @param {string} text
     * @param {string} fgColor 
     * @param {string} bgColor 
     */
    static print(text, fgColor, bgColor) {
        console.log(`${Times.getTime()} ${fgColor ?? ''}${bgColor ?? ''}${text}\x1b[0m`);
    }

    static printGreen(text) {
        this.print(text, fgColor.Green);
    }

    static printRed(text) {
        this.print(text, fgColor.Red);
    }

    static printYellow(text) {
        this.print(text, fgColor.Yellow);
    }

    static printGray(text) {
        this.print(text, fgColor.Gray);
    }
}

class ScriptHelper {
    
    /**
     * @param {string} name The script name
     * @return {import('minimist').ParsedArgs}
     */
    static init(name) {
        Loggers.print(`🚀 Executing '${name}'...`);
        const args = this.parseCLI();
        console.log(`   📝 Script arguments: ${JSON.stringify(args)}`);
        return args;
    }

    /**
     * @param {Record<string, { value?: string, defaultValue: string }>} newEnv 
     * @returns {[string, string][]}
     */
    static setEnv(newEnv) {
        const envPair = [];
        Object.entries(newEnv).forEach(([envName, { value, defaultValue }]) => {
            if (process.env[envName] !== null && process.env[envName] !== undefined) {
                console.log(Colors.yellow(`    Overwriting the existing environment: ${envName}`));
            }
            process.env[envName] = value ?? defaultValue;
            envPair.push([envName, value ?? defaultValue]);
        });
        return envPair;
    }
    
    /**
     * @template T
     * @param {T} argv An array of strings representing keys of env variables.
     * @returns {{ [K in T[number]: string] }}
     */
    static getEnv(argv) {
        const argMapping = {};
        for (const arg of argv) {
            argMapping[arg] = process.env[arg];
        }
        return argMapping;
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
    static parseCLI() {
        const CLIArgv = minimist(process.argv.slice(2));
        return CLIArgv;
    }
}

class ScriptProcess {
    
    /**
     * @typedef {import('child_process').StdioPipe} StdioPipe
     * @typedef {import('child_process').ChildProcessByStdio<StdioPipe, StdioPipe, StdioPipe>} ProcOptions
     */

    /**
     * @type {ReturnType<childProcess.spawn>}
     */
    _proc;
    
    /**
     * @type {boolean}
     */
    _spawned = false;

    /**
     * @param {string} scriptName
     * @param {string} scriptCommand 
     * @param {string[]} commandArgs 
     * @param {string[]} procArgs 
     * @param {ProcOptions & { logConfiguration?: [string, string | undefined][] }} procOpts 
     */
    constructor(
        scriptName,
        scriptCommand,
        commandArgs,
        procArgs,
        procOpts,
    ) {
        const cmdArgsString = commandArgs.join(' ');
        const procArgsString = procArgs.join(' ');
        const actualCommand = `${scriptCommand} ${cmdArgsString}`;
        
        Loggers.print(`${bgColor.White}${fgColor.Black}${scriptName}\x1b[0m`);
        console.log(`   🔧 Script: ${scriptCommand}`);
        console.log(`   🔨 Argument: ${cmdArgsString || 'N/A'}`);
        console.log(`   🛠️ Command: ${actualCommand}`);
        console.log();
        console.log(`   📦 Process argument: ${procArgsString || 'N/A'}`);
        console.log(`   🌍 Process configuration`);
        console.log(`       📂 CWD: ${procOpts.cwd || 'N/A'}`);
        console.log(`       📂 shell: ${procOpts.shell || 'N/A'}`);
        console.log(`       📂 stdio: ${procOpts.stdio || 'N/A'}`);
        for (const [configName, configValue] of procOpts.logConfiguration ?? []) {
            console.log(`       📂 ${configName}: ${configValue || 'N/A'}`);
        }
        console.log();

        // create the actual process
        const startTime = performance.now();
        const p = childProcess.spawn(actualCommand, procArgs, procOpts);
        this._proc = p;

        // listeners
        {
            /**
             * Event fires once the child process has spawned successfully.
             */
            p.on('spawn', () => {
                this._spawned = true;
            });

            /**
             * After the process has ended and the stdio streams of a child 
             * process have been closed.
             */
            p.on('close', code => {
                let finishMessage = code
                    ? Colors.red(`⚠️ The script '${scriptName}' exits with error code ${code}.`)
                    : `✅ The script '${scriptName}' finished.`;

                // perf log
                const endTime = performance.now();
                const spentInSec = (endTime - startTime) / 1000;
                finishMessage += ` Executed in ${Math.round(spentInSec * 100) / 100} seconds.`;

                Loggers.print(finishMessage);
                process.exit(code ?? 0);
            });

            /**
             * The event is emitted whenever:
             *  - The proc cannot be spawned.
             *  - The proc could not be killed.
             *  - Sending a message to the child proc failed.
             *  - The child proc was aborted via the `signal` option.
             */
            p.on('error', error => {
                Loggers.printRed(`⚠️ Script error encounters:`);
                console.log(error);
            });
        }
    }

    /** The actual process reference. */
    get proc() {
        return this._proc;
    }

    /** Is the process spawned successfully. */
    get isSpawned() {
        return this._spawned;
    }
}

/**
 * @deprecated
 */
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
                    process.stdout.write(`${Times.getTime()} ${Colors.red(`child process exited with error code ${code}`)}`);
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
module.exports = { utils, Colors, fgColor, bgColor, Times, Loggers, ScriptProcess, ScriptHelper };