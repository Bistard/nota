import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILogService } from "src/base/common/logger";
import { AsyncResult } from "src/base/common/result";
import { FileOperationError } from "src/base/common/files/file";
import { LanguageType } from "src/platform/i18n/common/localeTypes";
import { IFileService } from "src/platform/files/common/fileService";
import { ConfigurationModuleType, IConfigurationService } from "src/platform/configuration/common/configuration";
import { IConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { Strings } from "src/base/common/utilities/string";
import { WorkbenchConfiguration } from "src/workbench/services/workbench/configuration.register";
import { Disposable } from "src/base/common/dispose";

export const II18nService = createService<II18nService>("i18n-new-service");

export interface II18nOptions {
    readonly language: LanguageType;
    readonly localePath: URI;
}

export interface II18nLookUpTable {
    [index: number]: string;
}

export interface II18nService extends IService {
    /**
     * Current language.
     */
    readonly language: LanguageType;

    /**
     * Fires when the language changes.
     */
    readonly onDidChange: Register<void>;

    /**
     * Initializes the service, loading the default language's locale file.
     */
    init(): AsyncResult<void, FileOperationError | SyntaxError>;

    /**
     * Sets the language and reloads the locale file.
     */
    setLanguage(lang: LanguageType): Promise<void>;

    /**
     * Localize a key with optional interpolation.
     */
    localize(key: string /** | number (in runtime) */, defaultMessage: string, interpolation?: Record<string, any>): string;
}

/**
 * @class The i18n (internationalization) service for loading and translating 
 * locales.
 */
export class I18nService extends Disposable implements II18nService {
    
    // [fields]

    declare _serviceMarker: undefined;

    protected readonly _language: LanguageType;
    protected readonly _localeRootPath: URI; // the root that contains all the locales
    protected _table?: II18nLookUpTable;

    // [event]

    private readonly _onDidChange = this.__register(new Emitter<void>());
    public readonly onDidChange = this._onDidChange.registerListener;

    // [constructor]

    constructor(
        opts: II18nOptions,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService private readonly configurationService: IConfigurationService
    ) {
        super();
        this._language = opts.language;
        this._localeRootPath = opts.localePath;
        this.__register(this.configurationService.onDidConfigurationChange(this.__onConfigurationChange.bind(this)));
    }

    // [public methods]

    public get language(): LanguageType {
        return this._language;
    }

    public init(): AsyncResult<void, FileOperationError | SyntaxError> {
        this.logService.debug("i18n", "Initializing...");
        
        // load the look up table from the disk
        const uri = URI.join(this._localeRootPath, `${this._language}_lookup_table.json`);
        return this.fileService.readFile(uri)
            .andThen(buffer => Strings.jsonParseSafe<II18nLookUpTable>(buffer.toString()))
            .map(table => { 
                this._table = table;
                this.logService.debug("i18n", "Initialized successfully.");
            });
    }

    public async setLanguage(lang: LanguageType): Promise<void> {
        if (lang === this._language) {
            return;
        }
        await this.configurationService.set(WorkbenchConfiguration.DisplayLanguage, lang, { type: ConfigurationModuleType.User });
        // TODO: should reload the renderer page entirely
    }

    public localize(key: string /** | number (in runtime) */, defaultMessage: string, interpolation?: Record<string, any>): string {
        if (!this._table) {
            this.logService.warn("i18n", "Localization table is not loaded, returning default message.");
            return defaultMessage;
        }
        const value = this._table[key as unknown as number] || defaultMessage;
        return this.__insertToLocalize(value, interpolation);
    }

    // [private methods]

    private __onConfigurationChange(event: IConfigurationChangeEvent): void {
        const language = WorkbenchConfiguration.DisplayLanguage;
        if (event.affect(language)) {
            const newLanguage = this.configurationService.get<LanguageType>(language, LanguageType.en);
            this.setLanguage(newLanguage);
        }
    }

    private __insertToLocalize(value: string, interpolation?: Record<string, any>): string {
        if (!interpolation) {
            return value;
        }
        return value.replace(/\{(\w+)\}/g, (_, key) => {
            if (interpolation[key] !== undefined) {
                return String(interpolation[key]);
            }
            this.logService.warn("i18n", `Missing interpolation value for key: ${key}`);
            return `{${key}}`;
        });
    }
}
