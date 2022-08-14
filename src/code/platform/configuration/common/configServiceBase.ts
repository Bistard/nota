import { Disposable } from 'src/base/common/dispose';
import { Emitter, Register } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from 'src/base/common/file/uri';
import { ILogService } from 'src/base/common/logger';
import { IConfigChange, IConfigChangeEvent, IConfigModel, IConfigType } from 'src/code/platform/configuration/common/configModel';
import { IFileService } from 'src/code/platform/files/common/fileService';

export interface IConfigService extends Disposable {

    /** The resource of the configuration. */
    resource: URI;

    /** Fires once any configurations change. */
    readonly onDidChangeConfiguration: Register<IConfigChangeEvent>;

    /**
     * @description Given the section path of the configuration (seperated by .) 
     * and get the corresponding configuration and treated as the type T. If the
     * section path is never been set, a undefined will be returned.
     * 
     * @warn Once the section is not found, an error will be thrown.
     * 
     * @param section The section path, eg. 'window.markdown.file'
     * @returns The required type T configuration.
     */
    get<T>(section: string | undefined): T;
    
    /**
     * @description Given the section path of the configuration (seperated by .)
     * and set the given value to the provided path in this ConfigModel.
     * 
     * If section is not provided, the whole configuration object will be replaced.
     * 
     * If the given section path is never been set, a new section path will
     * be created and the value will be set as usual.
     * 
     * If the given section path already exists, the provided value will override 
     * the original configuration.
     * 
     * @note nothrow guarantee.
     * @param section The section path, eg. 'window.markdown.file'
     * @param value The configuration value to be written.
     */
    set(sections: string[] | undefined, values: any[]): void;
    set(section: string | undefined, value: any): void;
    set(arg1: any, arg2: any): void;

    /**
     * @description Checks if the given URI file path to a configuration file 
     * exists, if true, we read the the configuration into the memory. Otherwise
     * we create a new file in that location and write into a default configuration.
     */
    init(): Promise<void>;

    /**
     * @description Saves the current configuration from the memory to the disk.
     */
    save(): Promise<void>;
    
    
    /**
     * @description Reads the configuration from the disk to the memory.
     */
    read(): Promise<void>;

}

/**
 * @description The base class of every xxxConfigService. The class supports the 
 * general method for set and get the configuration from the provided ConfigModel. 
 * The derived class may provide different `IConfigModel` to the constructor.
 * 
 * Moreover, the base class provides the reading/writing the ConfigModel to the
 * provided URI path.
 * 
 * @note The base class provide a general event that fires every time when the 
 * configuration changes no matter what.
 * 
 * @note To achieve more specific event on different sections in the ConfigModel,
 * derived class needs to override the protected method `__fireOnSpecificEvent`.
 * See more details from that method documentation.
 * 
 */
export abstract class ConfigServiceBase extends Disposable implements IConfigService {

    // [field]
    
    protected _uri: URI;
    
    // [event]

    private readonly _onDidChangeConfiguration = this.__register(new Emitter<IConfigChangeEvent>());
    public readonly onDidChangeConfiguration = this._onDidChangeConfiguration.registerListener;

    // [constructor]

    constructor(
        private readonly getResourse: (path: URI) => URI,
        protected readonly rootPath: URI,
        protected readonly configType: IConfigType,
        protected readonly configModel: IConfigModel,
        protected readonly fileService: IFileService,
        protected readonly logService: ILogService,
    ) {
        super();
        this._uri = this.getResourse(rootPath);
    }

    // [getter / setter]

    get resource(): URI { return this._uri; }

    set resource(newVal: URI) { this._uri = newVal; }

    // [public method]

    public get<T>(section: string | undefined): T {
        const result = this.configModel.get<T>(section);
        if (result === undefined) {
            throw new ConfigurationError(section, this.configType);
        }
        return result;
    }

    public set(sections: string[] | undefined, values: any[]): void;
    public set(section: string | undefined, value: any): void;
    public set(arg1: any, arg2: any): void {

        if (Array.isArray(arg1) && Array.isArray(arg2)) {

            for (let i = 0; i < arg1.length; i++) {
                this.configModel.set(arg1[i], arg2[i]);
                this.__fireOnSpecificEvent(arg1[i], arg2[i]);
            }

            this.__fireOnAnyEvents(this.configType, { sections: arg1 });
        }
        
        else {
            this.configModel.set(arg1, arg2);
            this.__fireOnSpecificEvent(arg1, arg2);
            this.__fireOnAnyEvents(this.configType, { sections: [arg1] });
        }
    }

    public async init(): Promise<void> {
        try {
            if (await this.fileService.exist(this._uri) === false) {
                await this.fileService.createFile(
                    this._uri, 
                    DataBuffer.alloc(0), 
                    { overwrite: true },
                );
                await this.save();
            } else {
                await this.read();
            }
        }
        catch (err) {
            this.logService.error(`configuration loading failed at ${this._uri.toString()}.`);
            throw err;
        }

        this.logService.info(`configuration loaded at ${this._uri.toString()}.`);
    }

    public async save(): Promise<void> {
        try {
            await this.fileService.writeFile(
                this._uri, 
                DataBuffer.fromString(JSON.stringify(this.configModel.object, null, 2 /* indentation space */)), 
                { create: true, overwrite: true, unlock: true }
            );
        } catch(err) {
            throw new Error(`cannot save configuration to: ${this._uri.toString()}`);
        }
    }

    public async read(): Promise<void> {
        try {
            const textBuffer = await this.fileService.readFile(this._uri);
            const jsonObject: Object = JSON.parse(textBuffer.toString());
            Object.assign(this.configModel.object, jsonObject);
        } catch(err) {
            // TODO: if some specific config is missing. CHECK EACH ONE OF THE CONFIG (lots of work)
            throw new Error(`cannot read configuration from: ${this._uri.toString()}`);
        }
    }

    // [private helper method]

    /**
     * @description Will be fired when any type of configuration was changed.
     * @param type The type of configuration was fired.
     * @param changes The sections were changed.
     */
    private __fireOnAnyEvents(type: IConfigType, changes: IConfigChange): void {
        this._onDidChangeConfiguration.fire( {type: type, changes: changes} );
    }

    // [protected abstract method]

    /**
     * @description Overrides this method to fire event on specific section.
     * @param section The modified section that is about to notify.
     * @param change The modified value that is about to be fired.
     */
    protected abstract __fireOnSpecificEvent(section: string, change: any): void;
}

function configTypeToString(type: IConfigType): string {
    switch (type) {
        case IConfigType.GLOBAL:
            return 'global configuration';
        case IConfigType.USER:
            return 'user configuration';
        case IConfigType.TEST:
            return 'test configuration';
        default:
            return 'unknown configuration';
    }
}

export class ConfigurationError extends Error {

    constructor(section: string | undefined, configType: IConfigType) {
        super(`section "${section}" is not found in ${configTypeToString(configType)}`);
    }

}