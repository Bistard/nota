import * as assert from 'assert';
import { BuiltInConfigScope, ConfigScope, IConfigRegistrant } from 'src/code/platform/configuration/common/configRegistrant';
import { DefaultConfigStorage } from 'src/code/platform/configuration/common/configStorage';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';

class TestDefaultConfigStorage extends DefaultConfigStorage {
    protected override createDefaultModel(): Record<PropertyKey, any> {
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

    let registrant: IConfigRegistrant;
    setup(() => {
        registrant = REGISTRANTS.get(IConfigRegistrant);
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