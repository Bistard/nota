/**
 * @enum LanguageType
 * Defines the supported languages for the application.
 */
export const enum LanguageType {
    preferOS = 'preferOS', // os-based (Default)
    en = "en",             // English
    zhCN = "zh-cn",        // Chinese (Simplified)
    zhTW = "zh-tw",        // Chinese (Traditional)
}

export function validateLanguageType(raw: string): LanguageType {
    switch (raw) {
        case LanguageType.preferOS:
        case LanguageType.en:
        case LanguageType.zhCN:
        case LanguageType.zhTW:
            return raw;
        default:
            return LanguageType.preferOS;
    }
}