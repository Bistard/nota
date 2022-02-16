
// TODO: 'remote' is deprecated, use others instead
import { remote } from "electron";

/**
 * The current application directory.
 */
export const APP_ROOT_PATH = remote.app.getAppPath();

/**
 * The desktop directory.
 */
export const DESKTOP_ROOT_PATH = remote.app.getPath('desktop');

/**
 * The download directory.
 */
export const DOWNLOAD_ROOT_PATH = remote.app.getPath('downloads');

/**
 * A Boolean property that returns true if the app is packaged, false otherwise. 
 * For many apps, this property can be used to distinguish development and 
 * production environments.
 */
export const DEVELOP_ENV = !remote.app.isPackaged;