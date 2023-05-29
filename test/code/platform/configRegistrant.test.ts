import * as assert from 'assert';
import { Event } from 'src/base/common/event';
import { IConfigurationRegistrant, IConfigurationUnit } from 'src/code/platform/configuration/common/configRegistrant';
import { REGISTRANTS } from 'src/code/platform/registrant/common/registrant';

const enum TestConfiguration {
    One = 'configuration.test.one',
    Two = 'configuration.test.two',
    Three = 'configuration.test.three',
}

suite('configRegistrant-test', () => {

    const registrant: IConfigurationRegistrant = REGISTRANTS.get(IConfigurationRegistrant);
    
    const unit1: IConfigurationUnit = {
        id: 'configuration.test',
        properties: {
            [TestConfiguration.One]: {
                type: 'number',
                default: 0,
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
        }
    }; 

    test('registerConfiguration', () => {
        
        // register unit1
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
        });

        registrant.registerConfigurations(unit1);
        assert.strictEqual(unit1, registrant.getConfigurations()[0]);

        // register unit2
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.Three));
        });

        registrant.registerConfigurations(unit2);
        assert.strictEqual(unit2, registrant.getConfigurations()[1]);
    });

    test('unregisterConfiguration', () => {
        
        // unregister unit1
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
        });
        
        registrant.unregisterConfigurations(unit1);
        assert.strictEqual(unit2, registrant.getConfigurations()[0]);
    });

    test('updateConfigurations', () => {
        
        // register unit1 and unregister unit2
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
            assert.ok(e.properties.has(TestConfiguration.Three));
        });
        
        registrant.updateConfigurations({ add: [unit1], remove: [unit2] });
        assert.strictEqual(unit1, registrant.getConfigurations()[0]);
    });
});