import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/files/uri";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { ILogService } from "src/base/common/logger";
import { AsyncResult } from "src/base/common/result";
import { FileOperationError } from "src/base/common/files/file";
import { LanguageType } from "src/platform/i18n/common/localeTypes";

export const II18nNewService = createService<II18nNewService>("i18n-new-service");

export interface II18nNewOpts {
    language: LanguageType;
    localePath: URI;
}

export interface II18nNewService extends IService {
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
    localize(key: string, defaultMessage: string, interpolation?: Record<string, string>): string;
}

/**
 * @class The new i18n service for managing and translating locales.
 */
export class i18nNew implements II18nNewService {
    declare _serviceMarker: undefined;

    private _language: LanguageType;
    private _model: Record<string, string> = Object.create(null);

    private readonly _onDidChange = new Emitter<void>();
    public readonly onDidChange = this._onDidChange.registerListener;

    constructor(
        private readonly opts: II18nNewOpts,
        private readonly logService: ILogService,
    ) {
        this._language = opts.language;
    }

    get language(): LanguageType {
        return this._language;
    }

    /**
     * Initializes the i18nNew service.
     */
    public init(): AsyncResult<void, FileOperationError | SyntaxError> {
        this.logService.debug("i18nNew", "Initializing...");
        const uri = this.getLocaleFilePath(this._language);
        return this.loadLocaleFile(uri);
    }

    /**
     * Sets the language and reloads the locale file.
     */
    public async setLanguage(lang: LanguageType): Promise<void> {
        this._language = lang;
        const uri = this.getLocaleFilePath(lang);
        await this.loadLocaleFile(uri).unwrap();
        this._onDidChange.fire();
    }

    /**
     * Translates a key with optional interpolation.
     */
    public localize(key: string, defaultMessage: string, interpolation?: Record<string, string>): string {
        const value = this._model[key] || key;
        return this.insertToTranslation(value, interpolation);
    }

    /**
     * Insert variables into the translation string.
     */
    private insertToTranslation(value: string, insertion?: Record<string, string>): string {
        if (!insertion) {
            return value;
        }
        return value.replace(/\{(\w+)\}/g, (_, key) => insertion[key] ?? `{${key}}`);
    }

    /**
     * Constructs the file path for the specified language.
     */
    private getLocaleFilePath(language: LanguageType): URI {
        return URI.join(this.opts.localePath, `${language}.json`);
    }

    /**
     * Load locale JSON file.
     */
    private loadLocaleFile(uri: URI): AsyncResult<void, FileOperationError | SyntaxError> {
        throw new Error("Method not implemented.");
    }
}
