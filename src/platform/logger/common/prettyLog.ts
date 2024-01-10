import { TextColors } from "src/base/common/color";
import { getCurrTimeStamp } from "src/base/common/date";
import { tryOrDefault } from "src/base/common/error";
import { Schemas } from "src/base/common/files/uri";
import { Additionals, ILogService, LogLevel, PrettyTypes, parseLogLevel } from "src/base/common/logger";
import { iterPropEnumerable } from "src/base/common/utilities/object";
import { Triple, isObject } from "src/base/common/utilities/type";

export function testPrettyLog(logService: ILogService): void {
    logService.trace('FileTreeService', 'this is trace');
    logService.debug('FileTreeService', 'this is debug');
    logService.info('FileTreeService', 'this is info');
    logService.info('FileTreeService', 'this is info', {
        isPackaged: false,
        mode: 0,
        userHomePath: 'c:\\Users\\Chris Li\\AppData\\Roaming\\nota',
        tmpDirPath:    'c:\\Users\\CHRISL~1\\AppData\\Local\\Temp',
        appRootPath:   "p:\\dev\\nota",
        key0:   [1, 2, 3, 4, 5, 6],
        key1: undefined,
        key2: null,
        key3: `hello world`,
        key4: { nest: 114514, nesty: 'nesty' },
        array: [ false, 0, { nest: 114514, nesty: 'nesty' }, 'hello world', "p:\\dev\\nota" ]
    });
    logService.warn('FileTreeService', 'this is warn');
    logService.error('FileTreeService', 'this is error');
    logService.error('FileTreeService', 'this is an error', new Error('This is error message'));
    logService.fatal('FileTreeService', 'this is fatal');
}

export function prettyLog(
    color: boolean,
    logLevel: LogLevel, 
    description: string,
    reporter: string,
    message: string,
    error?: any,
    additional?: Additionals,
): string 
{
    const levelStr = getLevelString(color, logLevel);
    const time = getTimeString(color);
    const descriptionStr = `${description}`;
    const reporterStr = `${reporter}`;
    const messageStr = `${message}`;
    const errorStr = getErrorString(color, error);
    const additionalStr = additional && getAddtionalString(1, color, additional);

    let result = `[${levelStr}] [${time}] [${descriptionStr}] [${reporterStr}] ${messageStr}\n`;
    if (errorStr.length > 0) {
        result += `${errorStr}\n`;
    }
    
    if (additionalStr && additionalStr.length > 0) {
        result += `${additionalStr}\n`;
    }

    return result;
}

function getLevelString(color: boolean, logLevel: LogLevel): string {
    const level = parseLogLevel(logLevel);
    
    const maxLength = 5; // ERROR.length = 5
    const padding = ' '.repeat(maxLength - level.length);

    const raw = ` ${level}${padding} `;
    if (!color) {
        return raw;
    }

    return TextColors.setRGBColor(raw, ...getLevelColor(logLevel));
}

function getLevelColor(level: LogLevel): Triple<number, number, number> {
    switch (level) {
        case LogLevel.TRACE: return [211, 211, 211]; // LightGray
        case LogLevel.DEBUG: return [15, 134, 214];  // LightBlue
        case LogLevel.INFO:  return [181, 206, 168]; // LightGreen
        case LogLevel.WARN:  return [206, 145, 120]; // LightYellow
        case LogLevel.ERROR: return [235, 57, 65];   // LightRed
        case LogLevel.FATAL: return [190, 40, 255];  // Magenta
        default:             return [211, 211, 211]; // LightGray
    }
}

function getTimeString(color: boolean): string {
    const raw = `${getCurrTimeStamp().slice(0, -4)}`;
    if (!color) {
        return raw;
    }
    return TextColors.setRGBColor(raw, ...[96, 151, 83]);
}

function getErrorString(color: boolean, error: any): string {
    /**
     * We have to check the runtime type of the `error` since those error can be 
     * catched by a try-catch and the client might be wrong about those errors'
     * type.
     */
    
    // no errors
    if (error === undefined) {
        return '';
    }

    if (!(error instanceof Error)) {
        return `    ${tryPaintValue(1, color, 'error', error)}`;
    }

    const stackLines = error.stack ? error.stack.split('\n') : [];
    let maxLength = 0;

    // Find the maximum length of the lines
    for (const line of stackLines) {
        maxLength = Math.max(maxLength, line.trim().length);
    }

    // Adding space for formatting and borders
    maxLength += 6; 

    // Create top and bottom borders based on the maxLength
    const borderLine = '-'.repeat(maxLength);

    const topBorder = `+${borderLine}+`;
    const bottomBorder = `+${borderLine}+`;

    const formattedLines = stackLines.map((line, index) => {
        const trimed = line.trim();
        if (index === 0) {
            // Format the first line (Error message)
            return `| ${trimed} `.padEnd(maxLength + 1, ' ') + '|';
        }
        // Format stack trace lines
        return `| [${index}] ${trimed} `.padEnd(maxLength + 1, ' ') + '|';
    });

    return [topBorder, ...formattedLines, bottomBorder].map(str => `    ${str}`).join('\n');
}

function getAddtionalString(depth: number, color: boolean, additional: Additionals): string {    
    const keys: string[] = [];
    const values: string[] = [];
    
    let result = '';
    let maxKeyLength = 0;

    iterPropEnumerable(additional, key => {
        const value = additional[key];
        const valueStr = tryPaintValue(depth, color, key, value);

        keys.push(key);
        values.push(valueStr);
        maxKeyLength = Math.max(maxKeyLength, key.length);
    }, -1);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        const padding = ' '.repeat(maxKeyLength - key.length);
        result += `${'    '.repeat(depth)}(${key})${padding}` + ' ' + values[i] + '\n';
    }

    return result.slice(0, -1); // remove the last `\n`
}

const PREDEFINE_STRING_COLOR_KEY = ['URI', 'uri', 'path', 'at'];

function tryPaintValue(depth: number, color: boolean, key: string, value: any): string {

    if (!color) {
        return tryOrDefault('[parse error]', () => JSON.stringify(value));
    }

    if (typeof value === 'string'  && 
        (
            PREDEFINE_STRING_COLOR_KEY.includes(key) || 
            key.endsWith('path') ||
            key.endsWith('Path') ||
            key.endsWith('URI') ||
            key.endsWith('uri')
        )
    ) {
        return TextColors.setRGBColor(value, ...[15, 134, 214]);
    }

    return paintDefaultValue(depth, value, false);
}

function paintDefaultValue(depth: number, value: PrettyTypes, insideArray: boolean): string {
    switch (typeof value) {
        case "number": return TextColors.setRGBColor(`${value}`, ...[181, 206, 168]);
        case "string": {
            if (value.startsWith(Schemas.FILE) || value.startsWith(Schemas.HTTP) || value.startsWith(Schemas.HTTPS)) {
                return TextColors.setRGBColor(value, ...[15, 134, 214]);
            }
            return value;
        }
        case "bigint":
        case "boolean":
        case "symbol":
        case "undefined":
            return TextColors.setRGBColor(`${value}`, ...[15, 134, 214]);
        case "function":
            return tryOrDefault('[parse error]', () => JSON.stringify(value));
        case "object": {
            if (value === null) {
                return TextColors.setRGBColor('null', ...[15, 134, 214]);
            }

            // recursive paint the array
            if (Array.isArray(value)) {
                let arr = '[ ';
                
                if (value.length > 0) {
                    arr += paintDefaultValue(depth, value[0], true);
                }
                
                for (let i = 1; i < value.length; i++) {
                    arr += ', ';
                    arr += paintDefaultValue(depth, value[i], true);
                }
                arr += ' ]';
                return arr;
            }

            // recursive paint object
            if (isObject(value) && !insideArray && !(value instanceof Error)) {
                return `\n${getAddtionalString(depth + 1, true, <any>value)}`;
            }

            return tryOrDefault('[parse error]', () => JSON.stringify(value));
        }
    }
}