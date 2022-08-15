import * as fs from "fs";
import { BrowserWindow, dialog } from "electron";
import { ILogService } from "src/base/common/logger";
import { IS_MAC } from "src/base/common/platform";
import { AsyncQueue } from "src/base/common/util/async";
import { mockType, NulltoUndefined } from "src/base/common/util/type";
import { InternalOpenDialogOptions, OpenDialogOptions } from "src/code/platform/dialog/common/dialog";
import { createDecorator } from "src/code/platform/instantiation/common/decorator";

export const IMainDialogService = createDecorator<IMainDialogService>('main-dialog-service');

/**
 * An interface only for {@link MainDialogService}.
 */
export interface IMainDialogService {
    
    openFile(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;
    openDirectory(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;
    openFileOrDirectory(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]>;    
    
    showOpenDialog(opts: Electron.OpenDialogOptions, window?: BrowserWindow): Promise<Electron.OpenDialogReturnValue>;
    showSaveDialog(opts: Electron.SaveDialogOptions, window?: BrowserWindow): Promise<Electron.SaveDialogReturnValue>;
    showMessageBox(opts: Electron.MessageBoxOptions, window?: BrowserWindow): Promise<Electron.MessageBoxReturnValue>;
}

type ElectronDialogReturnType = Electron.MessageBoxReturnValue | Electron.SaveDialogReturnValue | Electron.OpenDialogReturnValue;

/**
 * @class A wrapper service built on top of {@link Electron.dialog}. Except for 
 * the three vanilla APIs from electron, dialog-service also provides three 
 * extra APIs for opening different type of 'open-dialog's.
 */
export class MainDialogService implements IMainDialogService {

    // [field]

    /** 
     * Each {@link BrowserWindow} has its own dialog box queue to ensure does 
     * not exist two boxs at the same time.
     * @note -1 is the queue that contains all the dialogs with no bonded 
     *       BrowserWindow.
     */
    private readonly _dialogQueues = new Map<number, AsyncQueue<ElectronDialogReturnType>>();

    // [constructor]

    constructor(@ILogService private readonly logService: ILogService) {}

    // [public methods]

    public openFileOrDirectory(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]> {
        return this.__open({...opts, openDirectory: true, openFile: true }, window);
    }

    public openFile(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]> {
        return this.__open({...opts, openDirectory: false, openFile: true }, window);
    }

    public openDirectory(opts: OpenDialogOptions, window?: BrowserWindow): Promise<string[]> {
        return this.__open({...opts, openDirectory: true, openFile: false }, window);
    }

    public async showOpenDialog(opts: Electron.OpenDialogOptions, window?: BrowserWindow): Promise<Electron.OpenDialogReturnValue> {
        this.__resolveDefaultPath(opts);

        return this.__getDialogQueue<Electron.OpenDialogReturnValue>(window).queue(async () => {
            let dialogResult: Electron.OpenDialogReturnValue;

            if (window) {
                this.logService.trace(`Main#DialogService#showing open dialog with window ID: ${window.id}...`);
                dialogResult = await dialog.showOpenDialog(window, opts);
            } else {
                this.logService.trace(`Main#DialogService#showing open dialog...`);
                dialogResult = await dialog.showOpenDialog(opts);
            }

            return dialogResult;
        });
    }

    public async showSaveDialog(opts: Electron.SaveDialogOptions, window?: BrowserWindow): Promise<Electron.SaveDialogReturnValue> {
        this.__resolveDefaultPath(opts);

        return this.__getDialogQueue<Electron.SaveDialogReturnValue>(window).queue(async () => {
            let dialogResult: Electron.SaveDialogReturnValue;
            if (window) {
                this.logService.trace(`Main#DialogService#showing save dialog with window ID: ${window.id}...`);
                dialogResult = await dialog.showSaveDialog(window, opts);
            } else {
                this.logService.trace(`Main#DialogService#showing save dialog...`);
                dialogResult = await dialog.showSaveDialog(opts);
            }

            return dialogResult;
        });
    }

    public async showMessageBox(opts: Electron.MessageBoxOptions, window?: BrowserWindow): Promise<Electron.MessageBoxReturnValue> {
        return this.__getDialogQueue<Electron.MessageBoxReturnValue>(window).queue(async () => {
			if (window) {
                this.logService.trace(`Main#DialogService#showing message dialog with window ID: ${window.id}...`);
				return dialog.showMessageBox(window, opts);
			}
            this.logService.trace(`Main#DialogService#showing message dialog...`);
			return dialog.showMessageBox(opts);
		});
    }

    // [private helper methods]

    private async __open(opts: InternalOpenDialogOptions, window?: BrowserWindow): Promise<string[]> {

        // building up the actual dialog option
        const dialogOption: Electron.OpenDialogOptions = {
            title: opts.title,
            buttonLabel: opts.buttonLabel,
            defaultPath: opts.defaultPath,
        };

        // determine property of the dialog
		if (typeof opts.openFile === 'boolean' || typeof opts.openDirectory === 'boolean') {
			dialogOption.properties = undefined; // let it override based on the booleans

			if (opts.openFile && opts.openDirectory) {
				dialogOption.properties = ['multiSelections', 'openDirectory', 'openFile', 'createDirectory'];
			}
		}

		if (!dialogOption.properties) {
			dialogOption.properties = ['multiSelections', opts.openDirectory ? 'openDirectory' : 'openFile', 'createDirectory'];
		}

		if (IS_MAC) {
			dialogOption.properties.push('treatPackageAsDirectory');
		}

        const win = NulltoUndefined(window ?? BrowserWindow.getFocusedWindow());
        const openedResult = await this.showOpenDialog(dialogOption, win);
        return openedResult.filePaths;
    }

    private __getDialogQueue<T>(window?: BrowserWindow): AsyncQueue<T> {
        let queue: AsyncQueue<T>;

        if (!window) {
            queue = mockType(this._dialogQueues.get(-1));
            if (!queue) {
                this._dialogQueues.set(-1, new AsyncQueue());
            }
        } 
        else {
            queue = mockType(this._dialogQueues.get(window.id));
            if (!queue) {
                this._dialogQueues.set(window.id, new AsyncQueue());
            }
        }

        return queue;
    }

    private async __resolveDefaultPath(opts: { defaultPath?: string }): Promise<void> {
        if (opts.defaultPath) {
            try {
                await fs.promises.stat(opts.defaultPath);
            } catch {
                opts.defaultPath = undefined;
            }
        }
    }

}