import * as assert from 'assert';
import { II18nService } from "src/platform/i18n/browser/i18nService";

export function file2(i18n: II18nService) {
    assert.strictEqual('value6', i18n.localize('key6', 'value6'));
    assert.strictEqual('value6', i18n.localize('key6', 'value6'));
    assert.strictEqual('value6', i18n.localize('key6', 'value6'));
    assert.strictEqual('value7', i18n.localize('key7', 'value7'));
}