import { Emitter, Register } from "src/base/common/event";
import { URI } from "src/base/common/file/uri";
import * as path from "src/base/common/file/path";
import { IFileService } from "src/code/common/service/fileService/fileService";
import { isArray, isObject } from "src/base/common/type";
import { Section } from "src/code/platform/section";
import { createDecorator } from "src/code/common/service/instantiationService/decorator";

export const Ii18nService = createDecorator<Ii18nService>('i18n-service');

/* the default path where to read locales. */
const DefaultLocalesPath = 'assets/locales';
const DefaultLanguage = 'en';
const DefaultExtension = '.json';
const DefaultLocalesPrefix = '{';
const DefaultLocalesSuffix = '}';

export type Language = 
    'en' |      // English
    'zh-cn' |   // Chinese (Simplified)
    'zh-tw'     // Chinese (Traditional)
;

export type Ii18nSection = { [key: string]: string }

export interface Ii18nOpts {

    /**
     * The display language for initialization. If not provided, english is 
     * prefered.
     */
    readonly language?: Language;

    /**
     * The absolute path for reading all locales.
     *  - defaults to {@link DefaultLocalesPath}
     */
    readonly directory?: string;

    /**
     * Watch for changes in JSON files to reload locale on updates.
     *  - defaults to false
     */
    readonly autoReload?: boolean;

    /**
     * The options relates to locales.
     */
    readonly localeOpts: ILocaleOpts;
}

export interface ILocaleOpts {

    /**
     * The extension of a locale. (including the `dot`)
     *  - defaults to `.json`
     */
    readonly extension?: string;

    /**
     * The prefix to identify a variable in a locale json file.
     *  - defaults to {@link DefaultLocalesPrefix}
     */
    readonly prefix?: string;

    /**
     * The suffix to identify a variable in a locale json file.
     *  - defaults to {@link DefaultLocalesSuffix}
     */
    readonly suffix?: string;

}

export interface Ii18nService {

    readonly language: Language;

    /**
     * Will fires when the language setting is changed.
     */
    onDidChange: Register<void>;

    /**
     * Disposes all the resources and disables all the events.
     */
    dispose(): void;

    /**
     * Initializes all the settings and default language.
     */
    init(): Promise<void>;

    /**
     * Changes the current langauge to the provided one.
     * @param lang The new language.
     * 
     * @note will trigger {@link onDidChange}
     */
    setLanguage(lang: Language): void;
    
    /**
     * Gets the corresponding translation unit from the current locale, then 
     * replaces translation unit variables if exists by using provided 
     * interpolation.
     * @param section The idenfitier as a subsection of the current locale.
     * @param key The key to the request tranlation unit.
     * @param interpolation Variable replacement.
     * 
     * @example see `i18n.test.ts`.
     * 
     * @note trans stands for 'translation'.
     */
    trans(section: Section, key: string, interpolation?: string[]): string;
    trans(section: Section, key: string, interpolation?: { [key: string]: string }): string;
    trans(section: Section, key: string, interpolation?: string[] | { [key: string]: string }): string;

    // TODO
    /**
     * reload current locale.
     */
    reloadLocale(): Promise<void>;
}

/**
 * @class Internationalization (i18n) is the process that it can support local 
 * languages and cultural settings.
 */
export class i18n implements Ii18nService {

    // [Attributes]

    /* the actual javascript object to store the locale */
    protected _model: { [key: string]: Ii18nSection } = Object.create(null);

    /* the current display language */
    protected _language: Language | undefined;

    /* the absolute directory path to locales */
    protected _path: string;

    protected _autoReload: boolean;

    protected _extension: string;

    protected _prefix: string;

    protected _suffix: string;

    get language(): Language {
        if (this._language === undefined) {
            return 'en';
        }
        return this._language;
    }

    // [Events]

    /**
     * Fires when the language has been reset.
     */
    private readonly _onDidChange = new Emitter<void>();
    public readonly onDidChange = this._onDidChange.registerListener;

    // [Constructor]

    constructor(
        opts: Ii18nOpts,
        @IFileService private readonly fileService: IFileService,
    ) {
        // i18n related
        this._language   = opts.language   || DefaultLanguage;
        this._path       = opts.directory  || path.resolve(DefaultLocalesPath);
        this._autoReload = opts.autoReload || false;
        
        // locales related
        this._extension  = opts.localeOpts.extension || DefaultExtension;
        this._prefix     = opts.localeOpts.prefix    || DefaultLocalesPrefix;
        this._suffix     = opts.localeOpts.suffix    || DefaultLocalesSuffix;
    }

    // [Methods]

    public dispose(): void {
        this._onDidChange.dispose();
    }

    public async init(): Promise<void> {

        // read current language settings into program

        const uri = URI.fromFile(path.join(this._path, this._language + this._extension));
        await this.__readLocale(uri);
    }

    public setLanguage(lang: Language, opts?: ILocaleOpts): void {
        this._language = lang;

        if (opts) {
            this._extension = opts.extension || this._extension;
            this._prefix = opts.prefix || this._prefix;
            this._suffix = opts.suffix || this._suffix;
        }

        this._onDidChange.fire();
    }

    public trans(section: Section, key: string, interpolation?: string[]): string;
    public trans(section: Section, key: string, interpolation?: { [key: string]: string }): string;
    public trans(section: Section, key: string, interpolation?: string[] | { [key: string]: string }): string {
        
        const subsection = this._model[section];
        if (subsection === undefined) {
            throw new Error(`not found the given section "${section}" from the current locale "${this._language}"`);
        }

        const value = subsection[key];
        if (value === undefined) {
            throw new Error(`not found the given i18n key "${key}" from the current section "${section}"`);
        }

        if (interpolation === undefined) {
            return value;
        }
        
        let get: (key: string) => string | undefined;

        if (isArray(interpolation)) {
            get = (key: string) => { 
                const index = parseInt(key);
                if (index === NaN) {
                    throw new Error('i18n translation index variable should be number');
                }
                return interpolation[index]; 
            }
        } else if (isObject(interpolation)) {
            get = (key: string) => { return interpolation[key]; }
        } else {
            throw new Error('invalid type of interpolation, either an array of strings nor object.');
        }

        // interpolation process

        let tranlation = ''; // return value

        let searchIdx = 0, prefixIdx = -1, suffixIdx = -1;
        while (true) {
            // try to find a prefix
            if ((prefixIdx = value.indexOf(this._prefix, searchIdx)) === -1) {
                break;
            }

            // append the previous part of translation
            tranlation += value.substring(searchIdx, prefixIdx);

            // update serach index
            searchIdx = prefixIdx + this._prefix.length;

            // try to find a suffix
            if ((suffixIdx = value.indexOf(this._suffix, searchIdx)) === -1) {
                break;
            }

            // get the name of the variable
            const variable = value.substring(prefixIdx + this._prefix.length, suffixIdx);
            if (variable.length === 0) {
                throw new Error('i18n translation variable cannot be length 0');
            }

            // update search index
            searchIdx = suffixIdx + this._suffix.length;
            
            // get the replacement of the variable
            const replace = get(variable);
            if (replace === undefined) {
                throw new Error(`missing interpolation with (index) variable name: ${variable}`);
            }

            // append the replacement
            tranlation += replace;
        }

        if (searchIdx === 0 && prefixIdx === -1) {
            // no variables needed
            return value;
        } else {
            // append the rest of the string
            tranlation += value.substring(searchIdx);
            return tranlation;
        }
    }

    public async reloadLocale(): Promise<void> {
        
    }

    /***************************************************************************
     * Private Helper Functions
     **************************************************************************/

    /**
     * @description Reads the target locale file provided by the path into the 
     * program.
     * @param uri The absolute file path to the locale.
     *  eg. ../../en-US.json
     */
    private async __readLocale(uri: URI): Promise<void> {

        try {
            const buffer = await this.fileService.readFile(uri);
            const jsonObject: Object = JSON.parse(buffer.toString());
            Object.assign(this._model, jsonObject);
        } catch (err) {
            // TODO: logService and pops up notification window
            throw err;
        }
    }

}
