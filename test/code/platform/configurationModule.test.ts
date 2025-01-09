/* eslint-disable local/code-no-json-stringify */
import assert from "assert";
import { afterEach, before, beforeEach } from 'mocha';
import { tryOrDefault } from "src/base/common/error";
import { Event } from "src/base/common/event";
import { DataBuffer } from "src/base/common/files/buffer";
import { URI } from "src/base/common/files/uri";
import { ILogService } from "src/base/common/logger";
import { Arrays } from "src/base/common/utilities/array";
import { deepCopy } from "src/base/common/utilities/object";
import { DefaultConfiguration } from "src/platform/configuration/common/configurationModules/defaultConfiguration";
import { UserConfiguration } from "src/platform/configuration/common/configurationModules/userConfiguration";
import { ConfigurationRegistrant, IConfigurationRegistrant, IConfigurationSchema, IConfigurationUnit } from "src/platform/configuration/common/configurationRegistrant";
import { IFileService, FileService } from "src/platform/files/common/fileService";
import { InMemoryFileSystemProvider } from "src/platform/files/common/inMemoryFileSystemProvider";
import { IInstantiationService, InstantiationService } from "src/platform/instantiation/common/instantiation";
import { IRegistrantService, RegistrantService } from "src/platform/registrant/common/registrantService";
import { FakeAsync } from "test/utils/fakeAsync";
import { NullLogger } from "test/utils/testService";

suite('ConfigurationModule-test', () => {
    
    const enum TestConfiguration {
        One = 'configuration.test.one',
        Two = 'configuration.test.two',
        Three = 'configuration.test.three',
        Four1 = 'configuration.test.four.one',
        Four2 = 'configuration.test.four.two',
        Five = 'configuration.test',
    }
    
    const unit1: IConfigurationUnit = {
        id: 'configuration.test',
        properties: {
            [TestConfiguration.One]: {
                type: 'number',
                default: 5,
                minimum: 0,
            },
            [TestConfiguration.Two]: {
                type: 'string',
                default: 'hello world',
            },
        }
    };
    
    const unit2: IConfigurationUnit = {
        id: 'configuration.test.test',
        properties: {
            [TestConfiguration.Three]: {
                type: 'boolean',
                default: true,
            },
            [TestConfiguration.Four1]: {
                type: 'null',
            },
            [TestConfiguration.Four2]: {
                type: 'object',
                required: ['name', 'age', 'height'],
                properties: {
                    name: {
                        type: 'string',
                        default: 'Chris Li',
                    },
                    age: {
                        type: 'number',
                        minimum: 0,
                    },
                    height: {
                        type: 'number',
                        ranges: [[0, 220]],
                    }
                },
            },
            [TestConfiguration.Five]: {
                type: 'array',
                items: [
                    {
                        type: 'string',
                    },
                    {
                        type: 'string',
                        default: 'world',
                    }
                ],
            },
        }
    };
    
    suite('DefaultConfiguration-test', () => {
    
        let configuration: DefaultConfiguration;
        let di: IInstantiationService;
        let service: IRegistrantService;
        let registrant: IConfigurationRegistrant;

        before(() => {
            di = new InstantiationService();
            di.store(IInstantiationService, di);
        });
    
        /**
         * Create a new {@link DefaultConfiguration} every time.
         */
        beforeEach(() => {
            service = new RegistrantService(new NullLogger());
            di.store(IRegistrantService, service);
            
            registrant = new ConfigurationRegistrant();
            registrant.registerConfigurations(unit1);
            service.registerRegistrant(registrant as ConfigurationRegistrant);

            configuration = di.createInstance(DefaultConfiguration);
            configuration.init().unwrap();
        });
    
        test('constructor test - DefaultConfiguration instance with an empty model before init', () => {
            const configuration = di.createInstance(DefaultConfiguration);
            assert.deepEqual(configuration.getConfiguration().model, Object.create({}));
        });
    
        test('init test - first time initialization', () => {
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 5);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'hello world');
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.Three));
        });
    
        test('double init test - prevent double initialization', () => {
            try {
                configuration.init().unwrap();
                assert.fail();
            } catch {
                assert.ok(true);
            }
        });
    
        test('on configuration change test - self update configuration', () => {
            let fired = 0;
            configuration.onDidConfigurationChange(e => {
                fired++;
                Arrays.matchAll(e.properties, [
                    TestConfiguration.Three,
                    TestConfiguration.Four1,
                    TestConfiguration.Four2,
                    TestConfiguration.Five],
                    (arrVal, myVal) => arrVal === myVal,
                );
            });
            registrant.registerConfigurations(unit2);
    
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Three), true);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Four1), null);
            assert.deepEqual(configuration.getConfiguration().get(TestConfiguration.Four2), { 'name': 'Chris Li', 'age': undefined, 'height': undefined, });
            // assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Five), undefined);
    
            assert.strictEqual(fired, 1);
            registrant.unregisterConfigurations(unit2); // TODO
            assert.strictEqual(fired, 2);
        });
    
        test('reload test - should reset configurations', () => {
            // const oldModel = deepCopy(configuration.getConfiguration().model);
            // const oldSections = deepCopy(configuration.getConfiguration().sections);
    
            registrant.registerConfigurations(unit2);
    
            const newModel = deepCopy(configuration.getConfiguration().model);
            const newSections = deepCopy(configuration.getConfiguration().sections);
    
            /**
             * Reload should not make a difference in DefaultConfiguration since
             * default configuration can self update.
             */
            configuration.reload().unwrap();
    
            const newReloadModel = deepCopy(configuration.getConfiguration().model);
            const newReloadSections = deepCopy(configuration.getConfiguration().sections);
    
            assert.deepEqual(newModel, newReloadModel);
            assert.deepEqual(newSections, newReloadSections);
        });

        test('__extractDefaultValueFromObjectSchema', () => {
            class TestDefaultConfiguration extends DefaultConfiguration {
                public static extractDefaultValueFromObjectSchema(schema: IConfigurationSchema & { type: 'object' }): object | undefined {
                    return this.__extractDefaultValueFromObjectSchema(schema);
                }
            }

            const extractDefault = TestDefaultConfiguration.extractDefaultValueFromObjectSchema({
                id: 'configuration1',
                type: 'object',
                properties: {
                    'one': { type: 'number', default: 10, },
                    'two': { type: 'string', default: 'hello', },
                    'three': { type: 'null' },
                    'four': { type: 'boolean', default: false },
                    'five': { type: 'array', default: undefined, },
                }
            });

            assert.deepEqual(extractDefault, {
                'one': 10,
                'two': 'hello',
                'three': null,
                'four': false,
                'five': undefined,
            });

            registrant.unregisterConfigurations(registrant.getConfigurationUnits()); // TODO
        });

        test('createDefaultConfigurationStorage', () => {
            registrant.unregisterConfigurations(registrant.getConfigurationUnits()); // TODO

            registrant.registerConfigurations({
                id: 'configuration1',
                properties: {
                    'workbench': {
                        type: 'object',
                        properties: {
                            'one': { type: 'number', default: 10, },
                            'two': { type: 'string', default: 'hello', },
                            'three': { type: 'null' },
                            'four': { type: 'boolean', default: false },
                            'five': { type: 'array', default: undefined, },
                        }
                    }
                }
            });

            const storage = DefaultConfiguration.createDefaultConfigurationStorage(registrant);
            assert.deepEqual(storage.model, {
                'workbench': {
                    'one': 10,
                    'two': 'hello',
                    'three': null,
                    'four': false,
                    'five': undefined,
                }
            });
        });
    });
    
    suite('UserConfiguration-test', () => {
    
        let configuration: UserConfiguration;
        let fileService: IFileService;
        const baseURI = URI.parse('file:///testFile');
    
        let di: IInstantiationService;
        let service: IRegistrantService;
        let registrant: IConfigurationRegistrant;

        before(async () => {
            di = new InstantiationService();
            di.store(IInstantiationService, di);
            
            const logService = new NullLogger();
            di.store(ILogService, logService);

            fileService = new FileService(logService);
            fileService.registerProvider('file', new InMemoryFileSystemProvider());
            di.store(IFileService, fileService);
        });
    
        /**
         * Create a new {@link UserConfiguration} every time.
         */
        beforeEach(() => {
            service = new RegistrantService(new NullLogger());
            di.store(IRegistrantService, service);
            
            registrant = new ConfigurationRegistrant();
            service.registerRegistrant(registrant as ConfigurationRegistrant);
            registrant.registerConfigurations(unit1);

            configuration = di.createInstance(UserConfiguration, baseURI);
        });
    
        afterEach(() => {
            // RESET USER FILE
        });
    
        test('constructor test', () => {
            const configuration = di.createInstance(UserConfiguration, baseURI);
            assert.deepEqual(configuration.getConfiguration().model, Object.create({}));
        });
    
        test('init test - basics', () => FakeAsync.run(async () => {
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: 10,
                [TestConfiguration.Two]: 'bad world',
            }));
            await (fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, }).unwrap());
    
            (await configuration.init().unwrap());
            // console.log(configuration.getConfiguration().model);
    
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 10);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'bad world');
        }));
    
        test('init test - reading user configuration with missing properties', () => FakeAsync.run(async () => {
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: undefined,
                [TestConfiguration.Two]: undefined,
            }));
            await (fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, }).unwrap());
    
            await (configuration.init().unwrap());
            // console.log(configuration.getConfiguration().model);
    
            assert.strictEqual(tryOrDefault(undefined, () => configuration.getConfiguration().get(TestConfiguration.One)), undefined);
            assert.strictEqual(tryOrDefault(undefined, () => configuration.getConfiguration().get(TestConfiguration.Two)), undefined);
        }));
    
        test('double init test - prevent double initialization', () => FakeAsync.run(async () => {
            await assert.rejects(async () => {
                await (configuration.init().unwrap());
                await (configuration.init().unwrap());
            });
        }));
    
        test('onDidConfigurationChange - the source user configuration file has changed', () => FakeAsync.run(async () => {
            const stopWatch = await fileService.watch(baseURI).unwrap();

            await (configuration.init().unwrap());
    
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.One));
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.Two));
    
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: 10,
                [TestConfiguration.Two]: 'hello world',
            }));
            await (fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, }).unwrap());
    
            await Event.toPromise(configuration.onDidConfigurationChange).then(() => {
                assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 10);
                assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'hello world');
            });
    
            stopWatch.dispose();
        }));
        
        test('init test - read configurations that are nested-section instead plain-section SHOULD NOT WORK', () => FakeAsync.run(async () => {
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                'configuration': {
                    'test': {
                        'one': 10,
                        'two': 'hello world',
                    }
                },
            }));
            (await fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, }).unwrap());
    
            (await configuration.init().unwrap());
            assert.deepEqual(configuration.getConfiguration().model, {});
        }));
    });
});