import * as assert from 'assert';
import { Dictionary } from 'src/base/common/util/type';
import { BuiltInConfigScope, ConfigScope, IConfigurationRegistrant } from 'src/code/platform/configuration/common/configRegistrant';
import { DefaultConfigStorage } from 'src/code/platform/configuration/common/configStorage';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';

class TestDefaultConfigStorage extends DefaultConfigStorage {
    protected override createDefaultModel(): Dictionary<PropertyKey, any> {
        return {
            'path1': {
                a: undefined,
                b: null,
                c: 'hello',
                'path3': {},
            },
            'path2': {
                'path4': 100,
            },
            'hello': 'world',
        };
    }
}

suite('configRegistrant-test', () => {

    let registrant: IConfigurationRegistrant;
    setup(() => {
        registrant = REGISTRANTS.get(IConfigurationRegistrant);
    });

    test('onDidChange', () => {
        const storage = new TestDefaultConfigStorage();
        registrant.registerDefaultBuiltIn(BuiltInConfigScope.Test, storage);
        let scope: ConfigScope;
        let sections: string[] = [];
        registrant.onDidChange(event => {
            scope = event.scope;
            sections = event.sections;
        });

        storage.delete('path2.path4');
        assert.strictEqual(scope, BuiltInConfigScope.Test);
        assert.deepStrictEqual(sections, ['path2.path4']);

        storage.delete('path1');
        assert.strictEqual(scope, BuiltInConfigScope.Test);
        assert.deepStrictEqual(sections, ['path1']);
    });

});