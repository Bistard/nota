import * as assert from 'assert';
import { after, afterEach, before, beforeEach } from 'mocha';
import { tryOrDefault } from 'src/base/common/error';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from 'src/base/common/file/uri';
import { Arrays } from 'src/base/common/util/array';
import { deepCopy } from 'src/base/common/util/object';
import { ConfigurationStorage } from 'src/platform/configuration/common/configurationStorage';
import { ConfigurationHub } from 'src/platform/configuration/common/configurationHub';
import { IConfigurationRegistrant, IConfigurationUnit } from 'src/platform/configuration/common/configurationRegistrant';
import { FileService, IFileService } from 'src/platform/files/common/fileService';
import { InMemoryFileSystemProvider } from 'src/platform/files/common/inMemoryFileSystemProvider';
import { REGISTRANTS } from 'src/platform/registrant/common/registrant';
import { NullLogger } from 'test/utils/testService';
import { ConfigurationModuleType } from 'src/platform/configuration/common/configuration';
import { FakeAsync } from 'test/utils/fakeAsync';
import { Event } from 'src/base/common/event';
import { DefaultConfiguration } from 'src/platform/configuration/common/configurationModules/defaultConfiguration';
import { UserConfiguration } from 'src/platform/configuration/common/configurationModules/userConfiguration';

suite('ConfigurationHub-test (common)', () => {
    const enum TestConfiguration {
        One = 'configuration.test.one',
        Two = 'configuration.test.two',
        Three = 'configuration.test.three',
        Four1 = 'configuration.test.four.one',
        Four2 = 'configuration.test.four.two',
        Five = 'configuration.test',
    }

    const Registrant = REGISTRANTS.get(IConfigurationRegistrant);
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

        before(() => {
            Registrant.unregisterConfigurations(Registrant.getConfigurationUnits());
            Registrant.registerConfigurations(unit1);
        });

        after(() => {
            Registrant.unregisterConfigurations(Registrant.getConfigurationUnits());
        });

        /**
         * Create a new {@link DefaultConfiguration} every time.
         */
        beforeEach(() => {
            configuration = new DefaultConfiguration();
            configuration.init();
        });

        test('constructor test - DefaultConfiguration instance with an empty model before init', () => {
            const configuration = new DefaultConfiguration();
            assert.deepEqual(configuration.getConfiguration().model, Object.create({}));
        });

        test('init test - first time initialization', () => {
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 5);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'hello world');
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.Three));
        });

        test('double init test - prevent double initialization', () => {
            try {
                configuration.init();
                assert.fail();
            } catch {
                assert.ok(true);
            }
        });

        test('on configuration change test - self updation configuraiton', () => {
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
            Registrant.registerConfigurations(unit2);

            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Three), true);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Four1), null);
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.Four2));
            // assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Five), undefined);

            assert.strictEqual(fired, 1);
            Registrant.unregisterConfigurations(unit2);
            assert.strictEqual(fired, 2);
        });

        test('reload test - should reset configurations', () => {
            // const oldModel = deepCopy(configuration.getConfiguration().model);
            // const oldSections = deepCopy(configuration.getConfiguration().sections);

            Registrant.registerConfigurations(unit2);

            const newModel = deepCopy(configuration.getConfiguration().model);
            const newSections = deepCopy(configuration.getConfiguration().sections);

            /**
             * Reload should not make a difference in DefaultConfiguration since
             * default configuration can self update.
             */
            configuration.reload();

            const newReloadModel = deepCopy(configuration.getConfiguration().model);
            const newReloadSections = deepCopy(configuration.getConfiguration().sections);

            assert.deepEqual(newModel, newReloadModel);
            assert.deepEqual(newSections, newReloadSections);
        });
    });

    suite('UserConfiguration-test', () => {

        let configuration: UserConfiguration;
        let fileService: IFileService;
        const baseURI = URI.parse('file:///testFile');

        before(async () => {
            Registrant.unregisterConfigurations(Registrant.getConfigurationUnits()); // refresh
            Registrant.registerConfigurations(unit1);

            fileService = new FileService(new NullLogger());
            fileService.registerProvider('file', new InMemoryFileSystemProvider());
        });

        after(() => {
            Registrant.unregisterConfigurations(Registrant.getConfigurationUnits()); // refresh
        });

        /**
         * Create a new {@link UserConfiguration} every time.
         */
        beforeEach(() => {
            configuration = new UserConfiguration(baseURI, fileService, new NullLogger());
        });

        afterEach(() => { });

        test('constructor test', () => {
            const configuration = new UserConfiguration(baseURI, fileService, new NullLogger());
            assert.deepEqual(configuration.getConfiguration().model, Object.create({}));
        });

        test('init test - basics', () => FakeAsync.run(async () => {
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: 10,
                [TestConfiguration.Two]: 'bad world',
            }));
            await fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, });

            await configuration.init();
            // console.log(configuration.getConfiguration().model);

            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 10);
            assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'bad world');
        }));

        test('init test - reading user configuration with missing properties', () => FakeAsync.run(async () => {
            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: undefined,
                [TestConfiguration.Two]: undefined,
            }));
            await fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, });

            await configuration.init();
            // console.log(configuration.getConfiguration().model);

            assert.strictEqual(tryOrDefault(undefined, () => configuration.getConfiguration().get(TestConfiguration.One)), undefined);
            assert.strictEqual(tryOrDefault(undefined, () => configuration.getConfiguration().get(TestConfiguration.Two)), undefined);
        }));

        test('double init test - prevent double initialization', () => FakeAsync.run(async () => {
            try {
                await configuration.init();
                assert.fail();
            } catch {
                assert.ok(true);
            }
        }));

        test('onDidConfigurationChange - the source user configuration file has changed', () => FakeAsync.run(async () => {
            const stopWatch = fileService.watch(baseURI);
            await configuration.init();

            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.One));
            assert.throws(() => configuration.getConfiguration().get(TestConfiguration.Two));

            const jsonUserConfiguration = DataBuffer.fromString(JSON.stringify({
                [TestConfiguration.One]: 10,
                [TestConfiguration.Two]: 'hello world',
            }));
            await fileService.writeFile(baseURI, jsonUserConfiguration, { create: true, overwrite: true, });

            await Event.toPromise(configuration.onDidConfigurationChange).then(() => {
                assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.One), 10);
                assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Two), 'hello world');
            });

            stopWatch.dispose();
        }));
    });

    suite('ConfigurationHub-test', () => {

        test('get - method should return the value of the given key', () => {
            const defaultConfig = new ConfigurationStorage();
            defaultConfig.set('testKey', 'defaultValue');
            const userConfig = new ConfigurationStorage();
            userConfig.set('testKey', 'userValue');
            const hub = new ConfigurationHub(defaultConfig, userConfig);

            assert.strictEqual(hub.get('testKey'), 'userValue');
        });

        test('setInMemory / deleteInMemory - method should set value for the given key', () => {
            const defaultConfig = new ConfigurationStorage();
            defaultConfig.set('testKey', 'defaultValue');
            const userConfig = new ConfigurationStorage();
            const hub = new ConfigurationHub(defaultConfig, userConfig);

            hub.setInMemory('testKey', 'newValue');
            assert.strictEqual(hub.get('testKey'), 'newValue');

            hub.deleteInMemory('testKey');
            assert.strictEqual(hub.get('testKey'), 'defaultValue');
        });

        test('updateConfiguration() method should update configuration', () => {
            const defaultConfig = new ConfigurationStorage();
            const userConfig = new ConfigurationStorage();
            userConfig.set('testKey', 'userValue');
            const hub = new ConfigurationHub(defaultConfig, userConfig);

            const newDefaultConfig = new ConfigurationStorage();
            newDefaultConfig.set('testKey', 'newDefaultValue');
            hub.updateConfiguration(ConfigurationModuleType.Default, newDefaultConfig);
            assert.strictEqual(hub.get('testKey'), 'userValue');

            hub.updateConfiguration(ConfigurationModuleType.User, new ConfigurationStorage());
            assert.strictEqual(hub.get('testKey'), 'newDefaultValue');
        });

        test('compareAndUpdateConfiguration() method should update configuration and return changed keys', () => {
            const defaultConfig = new ConfigurationStorage();
            const userConfig = new ConfigurationStorage();
            userConfig.set('testKey', 'userValue');
            const hub = new ConfigurationHub(defaultConfig, userConfig);

            const newUserConfig = new ConfigurationStorage();
            newUserConfig.set('testKey', 'newUserValue');
            const { properties } = hub.compareAndUpdateConfiguration(ConfigurationModuleType.User, newUserConfig);

            assert.strictEqual(hub.get('testKey'), 'newUserValue');
            assert.deepStrictEqual(properties, ['testKey']);
        });
    });
});