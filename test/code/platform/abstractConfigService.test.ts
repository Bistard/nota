import * as assert from 'assert';
import { after } from 'mocha';
import { Schemas, URI } from 'src/base/common/file/uri';
import { Dictionary } from 'src/base/common/util/type';
import { AbstractConfigService } from 'src/code/platform/configuration/common/abstractConfigService';
import { ConfigCollection } from 'src/code/platform/configuration/common/configCollection';
import { BuiltInConfigScope, IConfigurationRegistrant } from 'src/code/platform/configuration/common/configRegistrant';
import { DefaultConfigStorage } from 'src/code/platform/configuration/common/configStorage';
import { FileService } from 'src/code/platform/files/common/fileService';
import { DiskFileSystemProvider } from 'src/code/platform/files/node/diskFileSystemProvider';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';
import { NullLifecycleService, NullLogger } from 'test/utils/utility';

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

suite('abstract-config-service-test', () => {

    const TestScope: BuiltInConfigScope = <any>'abstractConfigService-test-scope';
    const registrant = REGISTRANTS.get(IConfigurationRegistrant);

    const storage = new TestDefaultConfigStorage();
    registrant.registerDefaultBuiltIn(TestScope, storage);

    const logService = new NullLogger();
    const fileService = new FileService(logService);

    test('onDidChange', () => {
        fileService.registerProvider(Schemas.FILE, new DiskFileSystemProvider(logService));
        const collection = new ConfigCollection({
            resourceProvider: () => URI.fromFile('file://test'),
            builtIn: [TestScope],
        }, fileService, logService);
        const service = new AbstractConfigService(collection, fileService, logService, new NullLifecycleService());

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

    after(() => {
        fileService.dispose();
    });
});