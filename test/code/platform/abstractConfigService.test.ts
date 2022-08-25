import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { AbstractConfigService } from 'src/code/platform/configuration/common/abstractConfigService';
import { ConfigCollection } from 'src/code/platform/configuration/common/configCollection';
import { BuiltInConfigScope, IConfigRegistrant } from 'src/code/platform/configuration/common/configRegistrant';
import { DefaultConfigStorage } from 'src/code/platform/configuration/common/configStorage';
import { FileService } from 'src/code/platform/files/common/fileService';
import { Registrants } from 'src/code/platform/registrant/common/registrant';
import { NullLifecycleService, NullLogger } from 'test/testUtility';

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

suite('abstract-config-service-test', () => {

    const TestScope: BuiltInConfigScope = <any>'abstractConfigService-test-scope';
    const registrant = Registrants.get(IConfigRegistrant);

    const storage = new TestDefaultConfigStorage();
    registrant.registerDefaultBuiltIn(TestScope, storage);

    test('onDidChange', () => {
        const logService = new NullLogger();
        const collection = new ConfigCollection({
            resourceProvider: () => URI.fromFile('file://test'),
            builtIn: [TestScope],
        }, new FileService(logService), logService);
        const service = new AbstractConfigService(collection, new FileService(logService), logService, new NullLifecycleService());

        let updateValue: any;
        service.onDidChange<string>(TestScope, 'path1.c', value => updateValue = value);
        
        storage.set('path1.c', 'world');
        assert.strictEqual(updateValue, 'world');

        storage.set('path1', { 'c': 'again' });
        assert.strictEqual(updateValue, 'again');

        service.set(TestScope, null, { 'path1': { 'c': 'again!!!' } });
        assert.strictEqual(updateValue, 'again!!!');

        service.set(TestScope, 'path2', 100);
        assert.strictEqual(updateValue, 'again!!!');
    });

});