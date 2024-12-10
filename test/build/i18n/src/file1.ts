import { II18nService } from "src/platform/i18n/browser/i18nService";

export function file1(i18n: II18nService) {
    i18n.localize('key1', 'value1');
    i18n.localize('key4', 'value4');
    i18n.localize('key5', 'value5');
}