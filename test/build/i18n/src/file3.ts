import { II18nService } from "src/platform/i18n/browser/i18nService";

export function file3(i18n: II18nService) {
    i18n.localize('key8', 'value8');
    i18n.localize('key9', 'value9');
    i18n.localize('key10', 'value10');
    i18n.localize('key11', '{num} between {str}', { num: 5, str: 'world' });
    i18n.localize('key12', '{str1} between {str2}', { str1: 'hello', str2: 'world' });
}