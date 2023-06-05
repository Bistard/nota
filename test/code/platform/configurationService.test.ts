import * as assert from 'assert';
import { after, before } from "mocha";
import { Event } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ConfigurationModuleType } from 'src/code/platform/configuration/common/configuration';
import { IConfigurationRegistrant } from "src/code/platform/configuration/common/configurationRegistrant";
import { ConfigurationChangeEvent, MainConfigurationService } from "src/code/platform/configuration/common/configurationService";
import { FileService } from "src/code/platform/files/common/fileService";
import { InMemoryFileSystemProvider } from "src/code/platform/files/common/inMemoryFileSystemProvider";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";
import { FakeAsync } from 'test/utils/async';
import { NullLogger } from "test/utils/utility";

suite('MainConfiguratioService-test', () => {

    const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

    let logService: ILogService;
    let fileService: FileService;
    const userConfigURI = URI.parse('file:///testFile');
    const userConfig = {
        'section': 'user value',
    };

    async function reloadUserConfiguration(create = false) {
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify(userConfig)), { create: create });
    }

    before(() => FakeAsync.run(async () => {
        logService = new NullLogger();
        fileService = new FileService(logService);
        fileService.registerProvider('file', new InMemoryFileSystemProvider());

        await reloadUserConfiguration(true);
        Registrant.registerConfigurations({
            id: 'test',
            properties: {
                'section': {
                    type: 'string',
                    default: 'default value',
                }
            }
        });
    }));

    after(() => {
        // cleanup
        Registrant.unregisterConfigurations(Registrant.getConfigurationUnits());
    });

    test('get before Initialization - Should get undefined before initialization', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        
        let result = service.get('section');
        assert.strictEqual(result, undefined);
        
        await service.init();

        result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get user value', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await service.init();
    
        const result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get default value', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false });

        let result = service.get('section');
        assert.strictEqual(result, undefined);
        
        await service.init();

        result = service.get('section');
        assert.strictEqual(result, 'default value');

        await reloadUserConfiguration();
    }));

    test('get - Should return default value when section does not exist', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await service.init();
        
        const result = service.get('nonExistingSection', "default");
        assert.strictEqual(result, "default");
    }));

    test('set - Should throw error as set operation is not supported', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await service.init();

        assert.throws(() => service.set('section', 'value'), { message: '[MainConfigurationService] does not support `set`.' });
    }));

    test('delete - Should throw error as delete operation is not supported', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await service.init();

        assert.throws(() => service.delete('section'), { message: '[MainConfigurationService] does not support `Delete`.' });
    }));

    test('onDidConfigurationChange - DefaultConfiguration self update', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false });
        await service.init();

        let result = service.get('section1');
        assert.strictEqual(result, undefined);

        let fired = false;
        const disposable = service.onDidConfigurationChange((e) => {
            fired = true;
            assert.ok(e.type === ConfigurationModuleType.Default);
            assert.ok(e.properties.has('section1'));
            assert.ok(e.match('section1'));
            assert.strictEqual(service.get('section1'), 'default2 value');
        });

        Registrant.registerConfigurations({
            id: 'test1',
            properties: {
                'section1': {
                    type: 'string',
                    default: 'default2 value',
                }
            }
        });

        result = service.get('section1');
        assert.strictEqual(result, 'default2 value');
        
        assert.ok(fired);
        disposable.dispose();
        await reloadUserConfiguration();
    }));

    test('onDidConfigurationChange - UserConfiguration self update', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService(userConfigURI, fileService, logService);
        await service.init();

        let result = service.get('section');
        assert.strictEqual(result, 'user value');

        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false });

        await Event.toPromise(service.onDidConfigurationChange).then((e) => {
            assert.ok(e.type === ConfigurationModuleType.User);
            assert.ok(e.properties.has('section'));
            assert.ok(e.match('section'));
            assert.strictEqual(service.get('section'), 'default value');
        });
    }));

    suite('ConfigurationChangeEvent', () => {
        
        test('Should correctly initialize and check `affect` / `match` method', () => {
            const changeEvent = new ConfigurationChangeEvent({ properties: ["section1.section2"] }, ConfigurationModuleType.Default);
            assert.ok(changeEvent);
        
            assert.strictEqual(changeEvent.affect("section1"), false);
            assert.strictEqual(changeEvent.affect("section1.section2"), true);
            assert.strictEqual(changeEvent.affect("section1.section2.section3"), true);

            assert.strictEqual(changeEvent.match("section1"), false);
            assert.strictEqual(changeEvent.match("section1.section2"), true);
            assert.strictEqual(changeEvent.match("section1.section2.section3"), false);
        });
    });
});