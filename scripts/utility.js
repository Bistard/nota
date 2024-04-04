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

class TextColors {
	
    /**
	 * @description Sets the ANSI foreground and background colors for a given 
	 * string of text.
	 * 
	 * @param {string} text The text to be colored.
	 * @param {} bgColor The ANSI background color code to set for the text.
	 * @param {} fgColor The ANSI foreground color code to set for the text.
	 * @returns - The text string prefixed with ANSI color codes and suffixed 
	 * with a reset color code.
	 *
	 * @example
	 * const coloredText = setANSIColor("This is a colored message.", ASNIForegroundColor.Red, ASNIBackgroundColor.White);
	 * console.log(coloredText); // Prints the message in red color with white background in the console.
	 */
	static setANSIColor(text, fgColor, bgColor) {
		return `${fgColor ?? ''}${bgColor ?? ''}${text}\x1b[0m`;
	}

	/**
	 * @description Sets the ANSI (RGB) foreground for a given string of text. 
	 * The color is only supported with modern command line.
	 * @param {string} text The text to be colored.
     * @param {number} r 
     * @param {number} g
     * @param {number} b 
	 * @returns The text string prefixed with ANSI color codes and suffixed with 
	 * a reset color code.
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
module.exports = { utils, TextColors, fgColor, bgColor, Times, };