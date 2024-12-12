/**
 * @enum LanguageType
 * Defines the supported languages for the application.
 */
export const enum LanguageType {
    en = "en",         // English
    zhCN = "zh-cn",    // Chinese (Simplified)
    zhTW = "zh-tw",    // Chinese (Traditional)
}

/**
 * Utility class to manage and validate locale-related types and operations.
 */
export class LocaleUtils {
    /**
     * List of all supported languages.
     */
    private static readonly supportedLanguages: Set<string> = new Set([
        LanguageType.en,
        LanguageType.zhCN,
        LanguageType.zhTW,
    ]);

    /**
     * Validates if the given language is supported.
     * @param language The language to validate.
     * @returns `true` if supported, otherwise `false`.
     */
    public static isSupportedLanguage(language: string): boolean {
        return this.supportedLanguages.has(language);
    }

    /**
     * Returns the default language.
     * @returns The default language (`en`).
     */
    public static getDefaultLanguage(): LanguageType {
        return LanguageType.en;
    }
}
