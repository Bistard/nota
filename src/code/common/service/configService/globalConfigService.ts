import { pathJoin } from "src/base/common/string";
import { createFile, isFileExisted, readFromFileSync, writeToFile } from "src/base/node/io";
import { GLOBAL_CONFIG_FILE_NAME, IConfigService } from "src/code/common/service/configService/configService";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export type AppMode = 'debug' | 'release';

export const IGlobalConfigService = createDecorator<IConfigService>('global-config-service');

/** @deprecated */
/**
 * @description 'global' config module stores configuration that only stored at
 * application root path.
 */
 export class GlobalConfigService {

    constructor() {}

    /**
     * @description reads or creates a mdnote.config.json file in the given 
     * path, then creates the singleton instance of a GlobalConfigService.
     * 
     * @param path eg. D:\dev\AllNote
     * @param configNameWtihType eg. D:\dev\AllNote\config.json
     */
    public async init(path: string): Promise<void> {
        try {
            if (await isFileExisted(path, GLOBAL_CONFIG_FILE_NAME) === false) {
                await createFile(path, GLOBAL_CONFIG_FILE_NAME);
                await this.writeToJSON(path, GLOBAL_CONFIG_FILE_NAME);
            } else {
                await this.readFromJSON(path, GLOBAL_CONFIG_FILE_NAME);
            }
        } catch(err) {
            throw err;
        }
    }

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        try {
            const text = readFromFileSync(pathJoin(path, fileName));
            const jsonObject: Object = JSON.parse(text);
            Object.assign(this, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
        }
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        try {
            writeToFile(path, fileName, JSON.stringify(this, null, 2));
        } catch(err) {
            // do log here
        }
    }

    /***************************************************************************
     *                        Global Config Settings
     **************************************************************************/

    public appMode: AppMode = 'debug';

    public startPreviousNoteBookManagerDir: boolean = true;
    public previousNoteBookManagerDir: string = '';

    /**
     * If true, NoteBookManager will take the default config in '<appRootPath>/config.json'.
     * If false, NoteBookManager will create a local conig in '.mdnote/config.json'.
     * 
     */
    public defaultConfigOn: boolean = false;

}