import { URI } from "src/base/common/files/uri";
import { IService, createService } from "src/platform/instantiation/common/decorator";

export const IClipboardService = createService<IClipboardService>('clipboard-service');

export const enum ClipboardType {
    Text      = 'text',
    Resources = 'resource',
    Arbitrary = 'arbitrary',
}

export interface IClipboardService extends IService {

    /**
     * @description Writes content to the clipboard based on the specified 
     * `ClipboardType`. 
     * 
     * Supports writing either:
     *      - plain text,
     *      - an array of resources,
     *      - arbitrary data.
     * 
     * @param type The type of content to write to the clipboard.
     * @param content The content to write to the clipboard.
     * @param key An identifier to the arbitrary data. Used to group them together.
     * @returns A promise that resolves when the operation is complete.
     */
    write(type: ClipboardType.Text, content: string): Promise<void>;
    write(type: ClipboardType.Resources, content: URI[]): void;
    write<T>(type: ClipboardType.Arbitrary, content: T, key: string): void;

    /**
     * @description Reads content from the clipboard based on the specified 
     * `ClipboardType`. The read data cannot be read again.
     * 
     * Supports writing either:
     *      - plain text,
     *      - an array of resources,
     *      - arbitrary data.
     * 
     * @param type The type of content to write to the clipboard.
     * @param key An identifier to the arbitrary data.
     * @returns A promise that resolves with the content read from the clipboard.
     */
    read(type: ClipboardType.Text): Promise<string>;
    read(type: ClipboardType.Resources): URI[];
    read<T>(type: ClipboardType.Arbitrary, key: string): T | undefined;
}