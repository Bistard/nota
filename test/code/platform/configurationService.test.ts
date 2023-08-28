import * as assert from 'assert';
import { after, before, beforeEach } from "mocha";
import { Event } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from "src/base/common/file/uri";
import { ILogService } from "src/base/common/logger";
import { ConfigurationModuleType } from 'src/platform/configuration/common/configuration';
import { IConfigurationRegistrant } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { MainConfigurationService } from 'src/platform/configuration/electron/mainConfigurationService';
import { FileService, IFileService } from "src/platform/files/common/fileService";
import { InMemoryFileSystemProvider } from "src/platform/files/common/inMemoryFileSystemProvider";
import { REGISTRANTS } from "src/platform/registrant/common/registrant";
import { FakeAsync } from 'test/utils/fakeAsync';
import { NullLogger } from "test/utils/testService";
import { BrowserConfigurationService } from 'src/platform/configuration/browser/browserConfigurationService';
import { delayFor } from 'src/base/common/util/async';
import { IInstantiationService, InstantiationService } from 'src/platform/instantiation/common/instantiation';

suite('MainConfiguratioService-test', () => {

    const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

    let instantiationService: IInstantiationService;
    let logService: ILogService;
    let fileService: FileService;
    const userConfigURI = URI.parse('file:///testFile');
    const userConfig = {
        'section': 'user value',
    };

    async function resetUserConfiguration(create = false) {
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify(userConfig)), { create: create, overwrite: true });
    }

    before(() => FakeAsync.run(async () => {
        instantiationService = new InstantiationService();

        logService = new NullLogger();
        fileService = new FileService(logService);
        fileService.registerProvider('file', new InMemoryFileSystemProvider());

        instantiationService.register(IFileService, fileService);
        instantiationService.register(ILogService, logService);
    }));

    beforeEach(() => FakeAsync.run(async () => {
        // clean the user configuration file
        await resetUserConfiguration(true);

        // reset the default registrant
        Registrant.unregisterConfigurations(Registrant.getConfigurationUnits());
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
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);

        let result = service.get('section');
        assert.strictEqual(result, undefined);

        await service.init();

        result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get user value', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await service.init();

        const result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get default value', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false });

        let result = service.get('section');
        assert.strictEqual(result, undefined);

        await service.init();

        result = service.get('section');
        assert.strictEqual(result, 'default value');
    }));

    test('get - Should return default value when section does not exist', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await service.init();

        const result = service.get('nonExistingSection', "default");
        assert.strictEqual(result, "default");
    }));

    test('set - Should throw error as set operation is not supported', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await service.init();

        await assert.rejects(() => service.set('section', 'value'));
    }));

    test('delete - Should throw error as delete operation is not supported', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await service.init();

        await assert.rejects(() => service.delete('section'));
    }));

    test('onDidConfigurationChange - DefaultConfiguration self update', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
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
    }));

    test('onDidConfigurationChange - UserConfiguration self update', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        await service.init();

        const result = service.get('section');
        assert.strictEqual(result, 'user value');

        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false });

        await Event.toPromise(service.onDidConfigurationChange).then((e) => {
            assert.ok(e.type === ConfigurationModuleType.User);
            assert.ok(e.properties.has('section'));
            assert.ok(e.match('section'));
            assert.strictEqual(service.get('section'), 'default value');
        });
    }));

    test('init - create a new file when not exists', () => FakeAsync.run(async () => {
        const service = new MainConfigurationService({ appConfiguration: { path: userConfigURI } }, instantiationService, logService);
        
        await fileService.delete(userConfigURI);
        await assert.rejects(() => fileService.readFile(userConfigURI)); // file does not exist
        
        await service.init();
        
        const content = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.deepStrictEqual(content, { 'section': 'default value' });
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

suite('BrowserConfigurationService', () => {

    const Registrant = REGISTRANTS.get(IConfigurationRegistrant);

    let instantiationService: IInstantiationService;
    let logService: ILogService;
    let fileService: FileService;
    const userConfigURI = URI.parse('file:///testFile');
    const userConfig = {
        'section': 'user value',
    };

    async function resetUserConfiguration(create = false) {
        await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify(userConfig)), { create: create, overwrite: true });
    }

    before(() => FakeAsync.run(async () => {
        instantiationService = new InstantiationService();

        logService = new NullLogger();
        fileService = new FileService(logService);
        fileService.registerProvider('file', new InMemoryFileSystemProvider());

        instantiationService.register(IInstantiationService, instantiationService);
        instantiationService.register(IFileService, fileService);
        instantiationService.register(ILogService, logService);
    }));

    beforeEach(() => FakeAsync.run(async () => {
        // clean the user configuration file
        await resetUserConfiguration(true);

        // reset the default registrant
        Registrant.unregisterConfigurations(Registrant.getConfigurationUnits());
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

    test('get - should get user value', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        const result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('set - in memory changes but file did not change', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        await service.set('section', 'update user value', { type: ConfigurationModuleType.Memory });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'update user value');

        // file is not updated
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], 'user value');
    }));

    test('set - user configuration changes', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        await service.set('section', 'update user value', { type: ConfigurationModuleType.User });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'update user value');

        // file is also updated
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], 'update user value');

        await resetUserConfiguration();
    }));

    test('set - user configuration changes, the main browser service also got notified.', () => FakeAsync.run(async () => {
        const browserService = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        const mainService = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        // init two sides
        await browserService.init();
        await mainService.init();
        
        // before change
        assert.strictEqual(browserService.get('section'), 'user value');
        assert.strictEqual(mainService.get('section'), 'user value');

        // change made
        await browserService.set('section', 'update user value', { type: ConfigurationModuleType.User });

        // in-memory is updated (browser-side)
        assert.strictEqual(browserService.get('section'), 'update user value');

        // file is also updated (browser-side)
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], 'update user value');

        // in-memory is updated (main-side)
        await delayFor(0);
        assert.strictEqual(mainService.get('section'), 'update user value');

        await resetUserConfiguration();
    }));

    test('delete - in memory changes but file did not change', () => FakeAsync.run(async() => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        await service.delete('section', { type: ConfigurationModuleType.Memory });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'default value');

        // file is not updated
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], 'user value');

        await resetUserConfiguration();
    }));

    test('delete - user configuration changes', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        await service.delete('section', { type: ConfigurationModuleType.User });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'default value');

        // file is also updated
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], undefined);

        await resetUserConfiguration();
    }));

    test('delete - user configuration changes, the main browser service also got notified.', () => FakeAsync.run(async () => {
        const browserService = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        const mainService = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        // init two sides
        await browserService.init();
        await mainService.init();
        
        // before change
        assert.strictEqual(browserService.get('section'), 'user value');
        assert.strictEqual(mainService.get('section'), 'user value');

        // change made
        await browserService.delete('section', { type: ConfigurationModuleType.User });

        // in-memory is updated (browser-side)
        assert.strictEqual(browserService.get('section'), 'default value');

        // file is also updated (browser-side)
        const configuration = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.strictEqual(configuration['section'], undefined);

        // in-memory is updated (main-side)
        await delayFor(0);
        assert.strictEqual(mainService.get('section'), 'default value');

        await resetUserConfiguration();
    }));

    test('set / delete - does not support set to default module type', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        await service.init();
        
        // does not support set to 'default' module
        await assert.rejects(() => service.set('section', 'update user value', { type: ConfigurationModuleType.Default }));
        await assert.rejects(() => service.delete('section', { type: ConfigurationModuleType.Default }));
    }));

    test('init - create a new file when not exists', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        await fileService.delete(userConfigURI);
        await assert.rejects(() => fileService.readFile(userConfigURI)); // file does not exist
        
        await service.init();
        
        const content = JSON.parse((await fileService.readFile(userConfigURI)).toString());
        assert.deepStrictEqual(content, { 'section': 'default value' });
    }));
});