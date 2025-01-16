/* eslint-disable local/code-no-json-stringify */
import * as assert from 'assert';
import { after, before, beforeEach } from "mocha";
import { Event } from 'src/base/common/event';
import { DataBuffer } from 'src/base/common/files/buffer';
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { ConfigurationModuleType } from 'src/platform/configuration/common/configuration';
import { ConfigurationRegistrant, IConfigurationRegistrant, IRawConfigurationChangeEvent } from "src/platform/configuration/common/configurationRegistrant";
import { ConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import { MainConfigurationService } from 'src/platform/configuration/electron/mainConfigurationService';
import { FileService, IFileService } from "src/platform/files/common/fileService";
import { InMemoryFileSystemProvider } from "src/platform/files/common/inMemoryFileSystemProvider";
import { FakeAsync } from 'test/utils/fakeAsync';
import { NullLogger } from "test/utils/testService";
import { BrowserConfigurationService } from 'src/platform/configuration/browser/browserConfigurationService';
import { delayFor } from 'src/base/common/utilities/async';
import { IInstantiationService, InstantiationService } from 'src/platform/instantiation/common/instantiation';
import { IRegistrantService, RegistrantService } from 'src/platform/registrant/common/registrantService';
import { INSTANT_TIME } from 'src/base/common/date';

suite('MainConfigurationService-test', () => {

    let registrant: IConfigurationRegistrant;

    let instantiationService: IInstantiationService;
    let logService: ILogService;
    let fileService: FileService;
    const userConfigURI = URI.parse('file:///testFile');
    const userConfig = {
        'section': 'user value',
    };

    async function resetUserConfiguration(create = false) {
        (await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify(userConfig)), { create: create, overwrite: true }).unwrap());
    }

    before(() => FakeAsync.run(async () => {
        registrant = new ConfigurationRegistrant();

        instantiationService = new InstantiationService();
        instantiationService.store(IInstantiationService, instantiationService);

        logService = new NullLogger();
        instantiationService.store(ILogService, logService);

        fileService = new FileService(logService);
        fileService.registerProvider('file', new InMemoryFileSystemProvider());
        instantiationService.store(IFileService, fileService);

        const registrantService = instantiationService.createInstance(RegistrantService);
        registrantService.registerRegistrant(<ConfigurationRegistrant>registrant);
        instantiationService.store(IRegistrantService, registrantService);
    }));

    beforeEach(() => FakeAsync.run(async () => {
        // clean the user configuration file
        await resetUserConfiguration(true);

        // reset the default registrant
        registrant.unregisterConfigurations(registrant.getConfigurationUnits());
        registrant.registerConfigurations({
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
        registrant.unregisterConfigurations(registrant.getConfigurationUnits());
    });

    test('get before Initialization - Should get undefined before initialization', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });

        let result = service.get('section');
        assert.strictEqual(result, undefined);

        (await service.init().unwrap());

        result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get user value', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        const result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('get - Should get default value', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false }).unwrap());

        let result = service.get('section');
        assert.strictEqual(result, undefined);

        (await service.init().unwrap());

        result = service.get('section');
        assert.strictEqual(result, 'default value');
    }));

    test('get - Should return default value when section does not exist', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        const result = service.get('nonExistingSection', "default");
        assert.strictEqual(result, "default");
    }));

    test('set - Should throw error as set operation is not supported', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        await assert.rejects(() => service.set('section', 'value', { type: ConfigurationModuleType.Memory }));
    }));

    test('delete - Should throw error as delete operation is not supported', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        await assert.rejects(() => service.delete('section', { type: ConfigurationModuleType.Memory }));
    }));

    test('onDidConfigurationChange - DefaultConfiguration self update', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false }).unwrap());
        (await service.init().unwrap());

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

        registrant.registerConfigurations({
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
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        const result = service.get('section');
        assert.strictEqual(result, 'user value');

        (await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify({})), { create: false }).unwrap());

        await Event.toPromise(service.onDidConfigurationChange).then((e) => {
            assert.ok(e.type === ConfigurationModuleType.User);
            assert.ok(e.properties.has('section'));
            assert.ok(e.match('section'));
            assert.strictEqual(service.get('section'), 'default value');
        });
    }));

    test('init - create a new file when not exists', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });

        (await fileService.delete(userConfigURI).unwrap());
        await assert.rejects(async () => (await fileService.readFile(userConfigURI)).unwrap()); // file does not exist
        
        (await service.init().unwrap());
        
        const content = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.deepStrictEqual(content, { 'section': 'default value' });
    }));

    suite('ConfigurationChangeEvent', () => {

        suite('constructor', () => {
            test('should initialize properties correctly from IRawConfigurationChangeEvent', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.properties.size, 2);
                assert.ok(event.properties.has('section1'));
                assert.ok(event.properties.has('section2'));
            });
        });

        test('simple case', () => {
            const changeEvent = new ConfigurationChangeEvent({ properties: ["section1.section2"] }, ConfigurationModuleType.Default);
            assert.ok(changeEvent);

            assert.strictEqual(changeEvent.affect("section1"), false);
            assert.strictEqual(changeEvent.affect("section1.section2"), true);
            assert.strictEqual(changeEvent.affect("section1.section2.section3"), true);

            assert.strictEqual(changeEvent.match("section1"), false);
            assert.strictEqual(changeEvent.match("section1.section2"), true);
            assert.strictEqual(changeEvent.match("section1.section2.section3"), false);
        });

        suite('match', () => {
            test('should return true if section matches exactly in properties', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.match('section1'), true);
                assert.strictEqual(event.match('section2'), true);
            });
    
            test('should return false if section does not match exactly in properties', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.match(''), false);
                assert.strictEqual(event.match('section3'), false);
                assert.strictEqual(event.match('section1.section2'), false);
                assert.strictEqual(event.match('section1.section3'), false);
            });
        });
    
        suite('affect', () => {
            test('should return true if section starts with any property key', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.affect('section1.subsection'), true);
                assert.strictEqual(event.affect('section2.subsection'), true);
            });
    
            test('should return false if section does not start with any property key', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.affect('section3.subsection'), false);
                assert.strictEqual(event.affect('unrelatedSection'), false);
            });
    
            test('should return true if section matches exactly with any property key', () => {
                const rawEvent: IRawConfigurationChangeEvent = {
                    properties: ['section1', 'section2']
                };
                const event = new ConfigurationChangeEvent(rawEvent, ConfigurationModuleType.Default);
    
                assert.strictEqual(event.affect('section1'), true);
                assert.strictEqual(event.affect('section2'), true);
            });
        });
    });
});

suite('BrowserConfigurationService', () => {

    let registrant: IConfigurationRegistrant;

    let instantiationService: IInstantiationService;
    let logService: ILogService;
    let fileService: FileService;
    const userConfigURI = URI.parse('file:///testFile');
    const userConfig = {
        'section': 'user value',
    };

    before(() => FakeAsync.run(async () => {
        registrant = new ConfigurationRegistrant();

        instantiationService = new InstantiationService();
        instantiationService.store(IInstantiationService, instantiationService);

        logService = new NullLogger();
        instantiationService.store(ILogService, logService);
        
        fileService = new FileService(logService);
        instantiationService.store(IFileService, fileService);
        fileService.registerProvider('file', new InMemoryFileSystemProvider());

        const registrantService = instantiationService.createInstance(RegistrantService);
        registrantService.registerRegistrant(<ConfigurationRegistrant>registrant);
        instantiationService.store(IRegistrantService, registrantService);
    }));

    beforeEach(() => FakeAsync.run(async () => {
        // clean the user configuration file
        await resetUserConfiguration(true);

        // set the default configuration
        registrant.registerConfigurations({
            id: 'test',
            properties: {
                'section': {
                    type: 'string',
                    default: 'default value',
                },
                'section1': {
                    type: 'object',
                    properties: {
                        'section2': {
                            type: 'number',
                            default: 5,
                        }
                    }
                }
            }
        });
    }));

    async function resetUserConfiguration(create = false) {
        (await fileService.writeFile(userConfigURI, DataBuffer.fromString(JSON.stringify(userConfig)), { create: create, overwrite: true }).unwrap());
    }

    test('get - should get user value', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        const result = service.get('section');
        assert.strictEqual(result, 'user value');
    }));

    test('set - in memory changes but file did not change', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        await service.set('section', 'update user value', { type: ConfigurationModuleType.Memory });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'update user value');

        // file is not updated
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'user value');
    }));
    
    test('set - in memory changes (more path)', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        // before set, should equal to default
        assert.strictEqual(service.get('section1.section2'), 5);

        // set path
        await service.set('section1.section2', 10, { type: ConfigurationModuleType.Memory });

        // in-memory is updated
        assert.strictEqual(service.get('section1.section2'), 10);
    }));

    test('set - user configuration changes', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        await service.set('section', 'update user value', { type: ConfigurationModuleType.User });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'update user value');

        // file is also updated
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'update user value');

        await resetUserConfiguration();
    }));

    test('set - user configuration changes, the main browser service also got notified.', () => FakeAsync.run(async () => {
        const browserService = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        const mainService = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        // init two sides
        (await browserService.init().unwrap());
        (await mainService.init().unwrap());
        
        // before change
        assert.strictEqual(browserService.get('section'), 'user value');
        assert.strictEqual(mainService.get('section'), 'user value');

        // change made
        await browserService.set('section', 'update user value', { type: ConfigurationModuleType.User });

        // in-memory is updated (browser-side)
        assert.strictEqual(browserService.get('section'), 'update user value');

        // file is also updated (browser-side)
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'update user value');

        // in-memory is updated (main-side)
        await delayFor(INSTANT_TIME);
        assert.strictEqual(mainService.get('section'), 'update user value');

        await resetUserConfiguration();
    }));

    test('set - cannot update when the section is not valid', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        await assert.rejects(() => service.set('invalidSection', 'update user value', { type: ConfigurationModuleType.Memory }));
    }));

    test('set - cannot update when the value is not valid', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());

        await assert.rejects(() => service.set('section', 42, { type: ConfigurationModuleType.Memory })); // should be string
    }));

    test('delete - in memory changes but file did not change', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        await service.delete('section', { type: ConfigurationModuleType.Memory });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'default value');

        // file is not updated
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'user value');

        await resetUserConfiguration();
    }));

    test('delete - user configuration changes', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        await service.delete('section', { type: ConfigurationModuleType.User });

        // in-memory is updated
        assert.strictEqual(service.get('section'), 'default value');

        // file is also updated
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'default value');

        await resetUserConfiguration();
    }));

    test('delete - user configuration changes, the main browser service also got notified.', () => FakeAsync.run(async () => {
        const browserService = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        const mainService = instantiationService.createInstance(MainConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        // init two sides
        (await browserService.init().unwrap());
        (await mainService.init().unwrap());
        
        // before change
        assert.strictEqual(browserService.get('section'), 'user value');
        assert.strictEqual(mainService.get('section'), 'user value');

        // change made
        await browserService.delete('section', { type: ConfigurationModuleType.User });

        // in-memory is updated (browser-side)
        assert.strictEqual(browserService.get('section'), 'default value');

        // file is also updated (browser-side)
        const configuration = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.strictEqual(configuration['section'], 'default value');

        // in-memory is updated (main-side)
        await delayFor(INSTANT_TIME);
        assert.strictEqual(mainService.get('section'), 'default value');

        await resetUserConfiguration();
    }));

    test('set / delete - does not support set to default module type', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        (await service.init().unwrap());
        
        // does not support set to 'default' module
        await assert.rejects(() => service.set('section', 'update user value', { type: ConfigurationModuleType.Default }));
        await assert.rejects(() => service.delete('section', { type: ConfigurationModuleType.Default }));
    }));

    test('init - create a new file when not exists', () => FakeAsync.run(async () => {
        const service = instantiationService.createInstance(BrowserConfigurationService, { appConfiguration: { path: userConfigURI } });
        
        (await fileService.delete(userConfigURI).unwrap());
        await assert.rejects(() => fileService.readFile(userConfigURI).unwrap()); // file does not exist
        
        (await service.init().unwrap());
        
        const content = JSON.parse(((await fileService.readFile(userConfigURI).unwrap())).toString());
        assert.deepStrictEqual(content, { 'section': 'default value', 'section1': { 'section2': 5 } });
    }));
});