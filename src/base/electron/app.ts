
// TODO: 'remote' is deprecated, use others instead
import { remote } from "electron";

export const APP_ROOT_PATH = remote.app.getAppPath();
export const DESKTOP_ROOT_PATH = remote.app.getPath('desktop');
export const DOWNLOAD_ROOT_PATH = remote.app.getPath('downloads');