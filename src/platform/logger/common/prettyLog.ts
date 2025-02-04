/* eslint-disable local/code-no-json-stringify */
import { TextColors } from "src/base/common/color";
import { getCurrTimeStamp } from "src/base/common/date";
import { tryOrDefault } from "src/base/common/error";
import { Schemas, URI } from "src/base/common/files/uri";
import { Additional, ILogService, LogLevel, PrettyTypes, parseLogLevel } from "src/base/common/logger";
import { Iterable } from "src/base/common/utilities/iterable";
import { iterPropEnumerable } from "src/base/common/utilities/object";
import { isError } from "src/base/common/utilities/panic";
import { Coordinate, Dimension, Position } from "src/base/common/utilities/size";
import { isFunction, isObject } from "src/base/common/utilities/type";

const MAX_RECURSIVE_DEPTH = 10;

const RGB_colors = <const>{
    LightGray:   [211, 211, 211],
    LightBlue:   [15, 134, 214],
    LightGreen:  [181, 206, 168],
    LightYellow: [206, 145, 120],
    LightRed:    [235, 57, 65],
    Magenta:     [190, 40, 255],
    Green:       [96, 151, 83], 
};

/**
 * @internal
 */
export function __testPrettyLog__(logService: ILogService): void {
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
    additional?: Additional,
): string 
{
    const levelStr = getLevelString(color, logLevel);
    const time = getTimeString(color, logLevel);
    const descriptionStr = `${description}`;
    const reporterStr = `${reporter}`;
    const messageStr = `${message}`;
    const errorStr = getErrorString(color, error);
    const additionalStr = additional && getAdditionalString(1, color, additional);

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

function getLevelColor(level: LogLevel): readonly [number, number, number] {
    switch (level) {
        case LogLevel.TRACE: return RGB_colors.LightGray;
        case LogLevel.DEBUG: return RGB_colors.LightBlue; 
        case LogLevel.INFO:  return RGB_colors.LightGreen;
        case LogLevel.WARN:  return RGB_colors.LightYellow;
        case LogLevel.ERROR: return RGB_colors.LightRed;  
        case LogLevel.FATAL: return RGB_colors.Magenta; 
        default:             return RGB_colors.LightGray;
    }
}

function getTimeString(color: boolean, level: LogLevel): string {
    const time = `${getCurrTimeStamp().slice(0, -4)}`;
    if (!color) {
        return time;
    }

    // normal time color
    if (level <= LogLevel.INFO) {
        return TextColors.setRGBColor(time, ...RGB_colors.Green);
    }

    if (level === LogLevel.WARN) {
        return TextColors.setRGBColor(time, ...RGB_colors.LightYellow);
    } else if (level === LogLevel.ERROR) {
        return TextColors.setRGBColor(time, ...RGB_colors.LightRed);
    } else  {
        return TextColors.setRGBColor(time, ...RGB_colors.Magenta);
    }
}

function getErrorString(color: boolean, error: any): string {
    /**
     * We have to check the runtime type of the `error` since those error can be 
     * caught by a try-catch and the client might be wrong about those errors'
     * type.
     */
    
    // no errors
    if (error === undefined || error === null) {
        return '';
    }

    if (!isError(error)) {
        return `    ${tryPaintValue(1, color, 'error', error)}`;
    }

    const stackLines: string[] = error.stack
        ? error.stack.split 
            ? error.stack.split('\n') // stack is a string, make it array of string
            : Array.isArray(error.stack)
                ? error.stack             // already array of string
                : []                      // weird data, we consider no stacks.
        : [];                             // no stacks
    
    // Find the maximum length of the lines (Adding space for formatting and borders)
    const maxLength = (Iterable.maxBy(stackLines, line => line.trim().length)?.length ?? 0) + 6;

    // Create top and bottom borders based on the maxLength
    const borderLine = '-'.repeat(maxLength);

    const topBorder = `+${borderLine}+`;
    const bottomBorder = `+${borderLine}+`;

    const formattedLines = stackLines.map((line, index) => {
        const trimmed = line.trim();
        if (index === 0) {
            // Format the first line (Error message)
            return `| ${trimmed} `.padEnd(maxLength + 1, ' ') + '|';
        }
        // Format stack trace lines
        return `| [${index}] ${trimmed} `.padEnd(maxLength + 1, ' ') + '|';
    });

    return [topBorder, ...formattedLines, bottomBorder].map(str => `    ${str}`).join('\n');
}

/**
 * @description Trying to print the 'additional' as an object by iterating its
 * properties and print them line by line in a format of:
 *      (property_name) property_value
 * 
 * @note Some certain types of object will be printed specially (e.g. URI).
 * 
 * @return Returns a string of the printing result.
 */
function getAdditionalString(depth: number, color: boolean, additional: Additional): string {    

    // safety
    if (depth === MAX_RECURSIVE_DEPTH) {
        return `${'    '.repeat(depth)}[REACHING MAXIMUM RECURSIVE DEPTH: ${MAX_RECURSIVE_DEPTH}]`;
    }

    const keys: string[] = [];
    const values: string[] = [];
    
    let result = '';
    let maxKeyLength = 0;

    // Iterate every provided property, parse them one by one into string.
    iterPropEnumerable(additional, (key, value) => {
        const valueStr = tryPaintValue(depth, color, key, value);

        keys.push(key);
        values.push(valueStr);
        maxKeyLength = Math.max(maxKeyLength, key.length);
    }, 0);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]!;
        const padding = ' '.repeat(maxKeyLength - key.length);
        result += `${'    '.repeat(depth)}(${key})${padding}` + ' ' + values[i] + '\n';
    }

    return result.slice(0, -1); // remove the last `\n`
}

function tryHandleSpecialAdditionalString(depth: number, color: boolean, additional: Additional): string | null {
    
    // Special case: URI
    if (URI.isURI(additional)) {
        const uriStr = URI.toString(additional);
        let valueStr = uriStr;
        if (color) {
            valueStr = TextColors.setRGBColor(uriStr, ...RGB_colors.LightBlue);
        }
        return valueStr;
    }

    // Special case: Size2D
    if (additional instanceof Dimension) {
        return `{ width: ${additional.width}, height: ${additional.height} }`;
    }
    else if (additional instanceof Position) {
        return `{ top: ${additional.top}, left: ${additional.left} }`;
    }
    else if (additional instanceof Coordinate) {
        return `{ x: ${additional.x}, y: ${additional.y} }`;
    }

    // not handled
    return null;
}

const PREDEFINE_STRING_COLOR_KEY = ['URI', 'uri', 'path', 'at'];

function tryPaintValue(depth: number, color: boolean, key: string, value: any): string {

    // 1: no color case
    if (!color) {
        // recursive print object
        if (isObject(value) && !isFunction(value) && !(value instanceof Error)) {
            return `\n${getAdditionalString(depth + 1, false, <any>value)}`;
        }

        if (isFunction(value)) {
            return '[function]';
        }

        return tryOrDefault('[parse error]', () => JSON.stringify(value));
    }

    // 2: color case
    if (typeof value === 'string' && 
        (
            PREDEFINE_STRING_COLOR_KEY.includes(key) || 
            key.endsWith('path') || key.endsWith('Path') ||
            key.endsWith('URI') || key.endsWith('uri')
        )
    ) {
        return TextColors.setRGBColor(value, ...RGB_colors.LightBlue);
    }

    return paintDefaultValue(depth, value, false);
}

function paintDefaultValue(depth: number, value: PrettyTypes, insideArray: boolean): string {
    switch (typeof value) {
        case "number": return TextColors.setRGBColor(`${value}`, ...RGB_colors.LightGreen);
        case "string": {
            if (value.startsWith(Schemas.FILE) || value.startsWith(Schemas.HTTP) || value.startsWith(Schemas.HTTPS)) {
                return TextColors.setRGBColor(value, ...RGB_colors.LightBlue);
            }

            if (value.length === 0) {
                return '\'\'';
            }

            return value;
        }
        case "bigint":
        case "boolean":
        case "symbol":
        case "undefined":
            return TextColors.setRGBColor(`${value}`, ...RGB_colors.LightBlue);
        case "function":
            return '[function]';
        case "object": {
            if (value === null) {
                return TextColors.setRGBColor('null', ...RGB_colors.LightBlue);
            }

            // recursive paint the array
            if (Array.isArray(value)) {
                let arr = '[';
                
                if (value.length > 0) {
                    arr += ' ';
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
                const handled = tryHandleSpecialAdditionalString(depth, true, <any>value);
                if (handled !== null) {
                    return handled;
                }

                return `\n${getAdditionalString(depth + 1, true, <any>value)}`;
            }

            return tryOrDefault('[parse error]', () => JSON.stringify(value));
        }
    }
}