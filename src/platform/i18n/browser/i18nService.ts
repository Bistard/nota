import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILogService } from "src/base/common/logger";
import { AsyncResult } from "src/base/common/result";
import { FileOperationError } from "src/base/common/files/file";
import { LanguageType } from "src/platform/i18n/common/localeTypes";
import { IFileService } from "src/platform/files/common/fileService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { IConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { Strings } from "src/base/common/utilities/string";

export const II18nNewService = createService<II18nNewService>("i18n-new-service");

export interface II18nNewOpts {
    language: LanguageType;
    localePath: URI;
}

export interface II18nModel {
    readonly version: string;
    readonly content: II18nLookUpTable;
}

export interface II18nLookUpTable {
    [index: number]: string;
}

export interface II18nNewService extends IService {
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
    setLanguage(lang: LanguageType): void;

    /**
     * Localize a key with optional interpolation.
     */
    localize(key: string, defaultMessage: string, interpolation?: Record<string, string>): string;
}

/**
 * @class The new i18n service for managing and translating locales.
 */
export class i18nNew implements II18nNewService {
    // [fields]

    declare _serviceMarker: undefined;

    private _language: LanguageType;
    private _table?: II18nLookUpTable;

    private readonly _onDidChange = new Emitter<void>();
    public readonly onDidChange = this._onDidChange.registerListener;

    // [constructor]

    constructor(
        private readonly opts: II18nNewOpts,
        @ILogService private readonly logService: ILogService,
        @IFileService private readonly fileService: IFileService,
        @IConfigurationService private readonly configurationService: IConfigurationService
    ) {
        this._language = opts.language;
        this.configurationService.onDidConfigurationChange(this.__onConfigurationChange.bind(this));
    }

    // [public methods]

    public get language(): LanguageType {
        return this._language;
    }

    public init(): AsyncResult<void, FileOperationError | SyntaxError> {
        this.logService.debug("i18nNew", "Initializing...");
        const uri = this.__getLocaleFilePath(this._language);
        return this.__loadLocaleFile(uri);
    }

    public setLanguage(lang: LanguageType): void {
        if (lang === this._language) {
            this.logService.info("i18nNew", `Language already set to: ${lang}`);
            return;
        }
        // TODO: should reload the renderer page entirely
    }

    public localize(key: string, defaultMessage: string, interpolation?: Record<string, string>): string {
        if (!this._table) {
            this.logService.warn("i18nNew", "Localization table is not loaded, returning default message.");
            return defaultMessage;
        }

        // Find the index of the key in the table
        const index = parseInt(key, 10);
        if (isNaN(index) || this._table[index] === undefined) {
            this.logService.warn("i18nNew", `Localization key '${key}' not found, returning default message.`);
            return defaultMessage;
        }

        return this.__insertToTranslation(this._table[index], interpolation);
    }

    // [private methods]

    private __onConfigurationChange(event: IConfigurationChangeEvent): void {
        if (event.affect("workbench.language")) {
            const newLanguage = this.configurationService.get<LanguageType>("workbench.language", LanguageType.en);
            this.setLanguage(newLanguage);
        }
    }

    private __insertToTranslation(value: string, insertion?: Record<string, string>): string {
        if (!insertion) {
            return value;
        }
        return value.replace(/\{(\w+)\}/g, (_, key) => {
            if (insertion[key] !== undefined) {
                return insertion[key];
            }
            this.logService.warn("i18nNew", `Missing interpolation value for key: ${key}`);
            return `{${key}}`;
        });
    }

    private __getLocaleFilePath(language: LanguageType): URI {
        return URI.join(this.opts.localePath, `${language}_flat.json`);
    }

    private __loadLocaleFile(uri: URI): AsyncResult<void, FileOperationError | SyntaxError> {
        this.logService.debug("i18nNew", `Loading flattened locale file: ${uri.toString()}`);

        return this.fileService.readFile(uri)
            .andThen(buffer =>
                Strings.jsonParseSafe<string[]>(buffer.toString()).map(data => {
                    this._table = data; // Directly assign the array to the lookup table
                })
            );
    }
}
