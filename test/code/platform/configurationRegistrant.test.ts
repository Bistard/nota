import * as assert from 'assert';
import { afterEach } from 'mocha';
import { Event } from 'src/base/common/event';
import { ConfigurationRegistrant, IConfigurationUnit } from 'src/platform/configuration/common/configurationRegistrant';

const enum TestConfiguration {
    One = 'configuration.test.one',
    Two = 'configuration.test.two',
    Three = 'configuration.test.three',
}

suite('configurationRegistrant-test', () => {

    const registrant = new ConfigurationRegistrant();

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

    afterEach(() => {
        registrant.unregisterConfigurations(registrant.getConfigurationUnits());
    });

    test('registerConfiguration', () => {

        // register unit1
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
        });

        registrant.registerConfigurations(unit1);
        assert.strictEqual(unit1, registrant.getConfigurationUnits()[0]);

        // register unit2
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.Three));
        });

        registrant.registerConfigurations(unit2);
        assert.strictEqual(unit2, registrant.getConfigurationUnits()[1]);
    });

    test('registerConfiguration - duplicate registration', () => {
        try {
            registrant.registerConfigurations(unit1);
        } catch { }
        assert.strictEqual(registrant.getConfigurationUnits().length, 2);
    });

    test('registerConfiguration - valid schema registration', () => {
        const path = 'invalid.schema.registration';

        const validUnit: IConfigurationUnit = {
            id: 'test',
            properties: {
                [`${path}0`]: {
                    type: 'null',
                    default: <any>true, // this value will be reset to default
                },
                [`${path}1`]: {
                    type: 'null',
                },
                [`${path}2`]: {
                    type: 'boolean',
                    default: true,
                },
                [`${path}3`]: {
                    type: 'number',
                    default: 5,
                },
                [`${path}4`]: {
                    type: 'string',
                    default: 'hello world',
                },
                [`${path}5`]: {
                    type: 'array',
                    default: [1, 2, 3],
                },
                [`${path}6`]: {
                    type: 'object',
                    default: { a: { b: { c: false } } },
                },
            }
        };

        registrant.registerConfigurations(validUnit);
        assert.strictEqual(validUnit.properties[`${path}0`]?.default, undefined);
        registrant.unregisterConfigurations(validUnit);
    });

    test('registerConfiguration & onErrorRegistration - invalid schema registration', () => {
        const path = 'invalid.schema.registration';

        const invalidUnit: IConfigurationUnit = {
            id: 'test',
            properties: {
                [`${path}2`]: {
                    type: 'boolean',
                    default: <any>'hello world',
                },
                [`${path}3`]: {
                    type: 'number',
                    default: <any>true,
                },
                [`${path}4`]: {
                    type: 'string',
                    default: <any>5,
                },
                [`${path}5`]: {
                    type: 'array',
                    default: <any>{ a: { b: { c: true } } },
                },
                [`${path}6`]: {
                    type: 'object',
                    default: <any>[1, 2, 3],
                },
            }
        };

        const errorSchemas = new Map<string, string | undefined>();

        registrant.onErrorRegistration(e => {
            errorSchemas.set(e.schema.type, e.message);
        });

        const dispoable = registrant.onDidConfigurationChange(e => {
            assert.fail('Should never fire');
        });

        registrant.registerConfigurations(invalidUnit);
        assert.notDeepStrictEqual(invalidUnit.properties, Object.create({}));
        assert.strictEqual(errorSchemas.get('boolean'), "The type of the default value 'string' does not match the schema type 'boolean'.");
        assert.strictEqual(errorSchemas.get('number'), "The type of the default value 'boolean' does not match the schema type 'number'.");
        assert.strictEqual(errorSchemas.get('string'), "The type of the default value 'number' does not match the schema type 'string'.");
        assert.strictEqual(errorSchemas.get('array'), "The type of the default value 'object' does not match the schema type 'array'.");
        assert.strictEqual(errorSchemas.get('object'), "The type of the default value 'object' does not match the schema type 'object'.");
        registrant.unregisterConfigurations(invalidUnit);

        dispoable.dispose();
    });

    test('unregisterConfiguration', () => {

        registrant.registerConfigurations(unit1);
        registrant.registerConfigurations(unit2);

        // unregister unit1
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
        });

        registrant.unregisterConfigurations(unit1);
        assert.strictEqual(unit2, registrant.getConfigurationUnits()[0]);
    });

    test('updateConfigurations', () => {

        registrant.registerConfigurations(unit2);

        // register unit1 and unregister unit2
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
            assert.ok(e.properties.has(TestConfiguration.Three));
        });

        registrant.updateConfigurations({ add: [unit1], remove: [unit2] });
        assert.strictEqual(unit1, registrant.getConfigurationUnits()[0]);
    });

    test('updateConfigurations (remove non-existed properties will still fire onDidConfigurationChange', () => {

        // register unit1 and unregister unit2
        Event.once(registrant.onDidConfigurationChange)(e => {
            assert.ok(e.properties.has(TestConfiguration.One));
            assert.ok(e.properties.has(TestConfiguration.Two));
            assert.ok(e.properties.has(TestConfiguration.Three));
        });

        registrant.updateConfigurations({ add: [unit1], remove: [unit2] });
        assert.strictEqual(unit1, registrant.getConfigurationUnits()[0]);
    });
});