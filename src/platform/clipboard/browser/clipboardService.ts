import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";

/**
 * @class Provides clipboard operations such as reading and writing text and 
 * resources. 
 * It supports operations for two types of clipboard content: 
 *      - plain text and 
 *      - resources, stored only in memory.
 *
 * @note The class uses the Clipboard API (`navigator.clipboard`) for text 
 *       operations.
 
 * @example
 * ```typescript
 * const logService = new LogService();
 * const clipboardService = new BrowserClipboardService(logService);
 *
 * // Writing text to the clipboard
 * await clipboardService.write(ClipboardType.Text, "Example text");
 *
 * // Reading text from the clipboard
 * const text = await clipboardService.read(ClipboardType.Text);
 *
 * // Writing resources to the clipboard (handled internally)
 * await clipboardService.write(ClipboardType.Resources, [new URI('path/to/resource')]);
 *
 * // Reading resources from the clipboard (retrieved from internal storage)
 * const resources = await clipboardService.read(ClipboardType.Resources);
 * ```
 */
export class BrowserClipboardService implements IClipboardService {

    declare _serviceMarker: undefined;
    
    // [fields]

    private _resources: URI[];

    // [constructor]

    constructor(
        @ILogService private readonly logService: ILogService,
    ) {
        this._resources = [];
    }

    // [public methods]

    public async write(type: ClipboardType.Text, content: string): Promise<void>;
    public async write(type: ClipboardType.Resources, content: URI[]): Promise<void>;
    public async write(type: ClipboardType, content: string | URI[]): Promise<void> {
        switch (type) {
            case ClipboardType.Text:
                return this.__writeText(<string>content);
            case ClipboardType.Resources:
                return this.__writeResources(<URI[]>content);
        }
    }

    public async read(type: ClipboardType.Text): Promise<string>;
    public async read(type: ClipboardType.Resources): Promise<URI[]>;
    public async read(type: ClipboardType): Promise<string | URI[]> {
        switch (type) {
            case ClipboardType.Text:
                return this.__readText();
            case ClipboardType.Resources:
                return this.__readResources();
        }
    }

    // [private helper methods]

    private async __writeText(content: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(content);
        } catch (error) {
            this.logService.error('ClipboardService', '"navigator" writeText error', error);
        }
    }
    
    private async __writeResources(content: URI[]): Promise<void> {
        this._resources = content;
    }

    private async __readText(): Promise<string> {
        try {
			return navigator.clipboard.readText();
		} catch (error) {
			this.logService.error('ClipboardService', '"navigator" readText error', error);
		}

        return '';
    }
    
    private async __readResources(): Promise<URI[]> {
        const currResources = this.__cleanResources();
        return currResources;
    }

    private __cleanResources(): URI[] {
        const oldResource = this._resources;
        this._resources = [];
        return oldResource;
    }
}