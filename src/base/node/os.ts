import * as os from 'os';

/**
 * @description Returns a string identifying the operating system platform. 
 * The value is set at compile time. 
 * Possible values are:
 *  - 'aix', 
 *  - 'darwin', 
 *  - 'freebsd', 
 *  - 'linux', 
 *  - 'openbsd', 
 *  - 'sunos', 
 *  - 'win32',
 * The return value is equivalent to `process.platform`.
 */
export const OPERATOR_SYSTEM = os.platform();

export const IS_WINDOWS = OPERATOR_SYSTEM === 'win32';
export const IS_LINUX = OPERATOR_SYSTEM === 'linux';