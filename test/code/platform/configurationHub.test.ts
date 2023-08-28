import * as assert from 'assert';
import { ConfigurationStorage } from 'src/platform/configuration/common/configurationStorage';
import { ConfigurationHub } from 'src/platform/configuration/common/configurationHub';
import { ConfigurationModuleType } from 'src/platform/configuration/common/configuration';

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