import * as assert from 'assert';
import { II18nService } from "src/platform/i18n/browser/i18nService";

export function file1(i18n: II18nService) {
    assert.strictEqual('value1', i18n.localize('key1', 'value1'));
    assert.strictEqual('value4', i18n.localize('key4', 'value4'));
    assert.strictEqual('value5', i18n.localize('key5', 'value5'));
}