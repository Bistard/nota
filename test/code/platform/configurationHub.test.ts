import * as assert from 'assert';
import { after, afterEach, before, beforeEach } from 'mocha';
import { DataBuffer } from 'src/base/common/file/buffer';
import { URI } from 'src/base/common/file/uri';
import { Arrays } from 'src/base/common/util/array';
import { deepCopy } from 'src/base/common/util/object';
import { DefaultConfiguration, UserConfiguration } from 'src/code/platform/configuration/common/configurationHub';
import { IConfigurationRegistrant, IConfigurationUnit } from 'src/code/platform/configuration/common/configurationRegistrant';
import { FileService, IFileService } from 'src/code/platform/files/common/fileService';
import { InMemoryFileSystemProvider } from 'src/code/platform/files/common/inMemoryFileSystemProvider';
import { ConsoleLogger } from 'src/code/platform/logger/common/consoleLoggerService';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';

process.on('warning', e => console.warn(e.stack)); // TODO

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
        assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Three), undefined);
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
        assert.strictEqual(configuration.getConfiguration().get(TestConfiguration.Four2), undefined);
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
