import { pathJoin } from "src/base/common/string";
import { readFromFileSync, writeToFile } from "src/base/node/file";
import { IConfigService } from "src/code/common/service/configService";

export type AppMode = 'debug' | 'release';

/**
 * @description 'global' config module stores configuration that only stored at
 * application root path.
 */
 export class GlobalConfigService implements IConfigService {

    /***************************************************************************
     *                               singleton
     **************************************************************************/
    
    private static _instance: GlobalConfigService;

    private constructor() {}

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async readFromJSON(path: string, fileName: string): Promise<void> {
        try {
            const text = readFromFileSync(pathJoin(path, fileName));
            const jsonObject: Object = JSON.parse(text);
            Object.assign(GlobalConfigService.Instance, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
        }
    }

    public async writeToJSON(path: string, fileName: string): Promise<void> {
        try {
            writeToFile(path, fileName, JSON.stringify(GlobalConfigService.Instance, null, 2));
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