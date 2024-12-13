import * as assert from 'assert';
import { IJsonSchema, IJsonSchemaValidateResult, JsonSchemaValidator } from 'src/base/common/json';
import { deepCopy } from 'src/base/common/utilities/object';

suite('json-test', function () {

    suite('JsonSchemaValidator-test', () => {

        suite('basics', () => {
            
            test('errorMessage', () => {
                const schema: IJsonSchema = { type: 'string', regexp: '^[a-z]+$', errorMessage: 'The string must be valid 26 characters' };

                let result = JsonSchemaValidator.validate('testing123', schema);
                assert.ok(!result.valid);
                assert.strictEqual(result.errorMessage, 'The string must be valid 26 characters');
                
                result = JsonSchemaValidator.validate('testing', schema);
                assert.ok(result.valid);
                assert.strictEqual(result['errorMessage'], undefined);
            });

            test('deprecatedMessage', () => {
                const schema: IJsonSchema = { type: 'string', regexp: '^[a-z]+$', deprecatedMessage: 'The setting is deprecated', deprecated: true };
                
                const result = JsonSchemaValidator.validate('Testing', schema);
                assert.ok(!result.valid);
                assert.strictEqual(result.deprecatedMessage, 'The setting is deprecated');
            });

            test('default value if data is not provided', () => {
                const schema: IJsonSchema = { type: 'string', regexp: '^[a-z]+$', default: 'testing', errorMessage: 'The string must be valid 26 characters' };
                
                const result = JsonSchemaValidator.validate(undefined, schema);
                assert.ok(!result.valid);
                assert.strictEqual(result.errorMessage, 'The string must be valid 26 characters');
                assert.strictEqual(result.schema?.default, 'testing');
            });
        });

        suite('string', () => {
            const schema1: IJsonSchema = { type: 'string', regexp: '^[a-z]+$' };
            const schema2: IJsonSchema = { type: 'string', minLength: 10, maxLength: 20, };

            test('Regular expression', function () {
                let result = JsonSchemaValidator.validate('testing', schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate('Testing123', schema1);
                assert.ok(!result.valid);
            });
    
            test('Null value in string field', function () {
                const result = JsonSchemaValidator.validate(null, schema1);
                assert.ok(!result.valid);
            });

            test('String length check', function () {
                let result = JsonSchemaValidator.validate('hello', schema2);
                assert.ok(!result.valid);
                
                result = JsonSchemaValidator.validate('hello world', schema2);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate('hello world hello world', schema2);
                assert.ok(!result.valid);
            });

            test('String with enum', function () {
                const schema: IJsonSchema = { type: 'string', enum: ['one', 'two', 'three'] };

                let result = JsonSchemaValidator.validate('one', schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate('two', schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate('hello world', schema);
                assert.ok(!result.valid);
            });
        });

        suite('number', () => {
            const schema1: IJsonSchema = { type: 'number', minimum: 10, maximum: 20 };
            const schema2: IJsonSchema = { type: 'number', integer: true };
    
            test('Number less than minimum', function () {
                let result = JsonSchemaValidator.validate(10, schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(9, schema1);
                assert.ok(!result.valid);
            });
    
            test('Number more than maximum', function () {
                let result = JsonSchemaValidator.validate(20, schema1);
                assert.ok(result.valid);
                
                result = JsonSchemaValidator.validate(21, schema1);
                assert.ok(!result.valid);
            });
    
            test('Float number', function () {
                let result = JsonSchemaValidator.validate(15.5, schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(15.5, schema2);
                assert.ok(!result.valid);
            });
    
            test('Negative number', function () {
                let result = JsonSchemaValidator.validate(-15, schema1);
                assert.ok(!result.valid);

                result = JsonSchemaValidator.validate(-15, schema2);
                assert.ok(result.valid);
            });
        });

        suite('boolean', function () {
            const schema: IJsonSchema = { type: 'boolean' };
    
            test('boolean validation', function () {
                let result = JsonSchemaValidator.validate(true, schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(false, schema);
                assert.ok(result.valid);
            });

            test('String instead of boolean', function () {
                const result = JsonSchemaValidator.validate("true", schema);
                assert.ok(!result.valid);
            });
    
            test('Number instead of boolean', function () {
                const result = JsonSchemaValidator.validate(1, schema);
                assert.ok(!result.valid);
            });
        });

        suite('null', () => {
            const schema: IJsonSchema = { type: 'null' };
    
            test('basics', function () {
                const result = JsonSchemaValidator.validate(null, schema);
                assert.ok(result.valid);
            });

            test('Zero instead of null', function () {
                const result = JsonSchemaValidator.validate(0, schema);
                assert.ok(!result.valid);
            });
    
            test('Empty string instead of null', function () {
                const result = JsonSchemaValidator.validate('', schema);
                assert.ok(!result.valid);
            });
        });

        suite('array', () => {
            const schema1: IJsonSchema = { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } };
            const schema2: IJsonSchema = { type: 'array', minItems: 2, maxItems: 4, uniqueItems: true, items: { type: 'string' } };
            
            test('basics - no uniques', function () {
                let result = JsonSchemaValidator.validate(['one', 'two', 'three'], schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(['one', 'two', 'two'], schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(['one'], schema1);
                assert.ok(!result.valid);

                result = JsonSchemaValidator.validate(['one', 'two', 'three', 'four', 'five'], schema1);
                assert.ok(!result.valid);
            });

            test('basics - uniques', function () {
                let result = JsonSchemaValidator.validate(['one', 'two', 'three'], schema2);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate(['one', 'two', 'two'], schema2);
                assert.ok(!result.valid);

                result = JsonSchemaValidator.validate(['one'], schema2);
                assert.ok(!result.valid);

                result = JsonSchemaValidator.validate(['one', 'two', 'three', 'four', 'five'], schema2);
                assert.ok(!result.valid);
            });
        });

        suite('object', () => {

            test('Basics', function () {
                const schema: IJsonSchema = {
                    type: 'object', 
                    minProperties: 2, 
                    maxProperties: 3, 
                    required: ['name', 'age'],
                    properties: {
                        name: { type: 'string' },
                        age: { type: 'number' },
                        email: { type: 'string' }
                    }
                };
        
                let result: IJsonSchemaValidateResult;
        
                result = JsonSchemaValidator.validate({ name: 'John' }, schema);
                assert.ok(!result.valid);
                
                result = JsonSchemaValidator.validate({ name: 'John', age: 25 }, schema);
                assert.ok(result.valid);
                
                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com' }, schema);
                assert.ok(result.valid);
                
                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra' }, schema);
                assert.ok(!result.valid);
            });

            const schema1: IJsonSchema = {
                type: 'object', 
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' },
                    email: { type: 'string' },
                },
                required: ['name'],
            };
            
            const schema2: IJsonSchema = deepCopy(schema1);
            const schema3: IJsonSchema = deepCopy(schema2);
            schema3.maxProperties = 5;
    
            test('Object with null value in nullable field', function () {
                let result: IJsonSchemaValidateResult;
                
                result = JsonSchemaValidator.validate({ name: 'John', age: 25 }, schema1);
                assert.ok(result.valid);
                
                result = JsonSchemaValidator.validate({ name: 'John', age: null }, schema1);
                assert.ok(result.valid);
            });
    
            test('Object with missing non-required field', function () {
                const result = JsonSchemaValidator.validate({ name: 'John' }, schema1);
                assert.ok(result.valid);
            });
    
            test('Object with additional property', function () {
                let result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra' }, schema1);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra' }, schema2);
                assert.ok(result.valid);
            });

            test('Object with limited property count', function () {
                let result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra', extra1: 'extra1' }, schema3);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra', extra1: 'extra1', extra2: 'extra2' }, schema3);
                assert.ok(!result.valid);
            });

            const baseSchema: IJsonSchema = {
                type: 'object', 
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' },
                    email: { type: 'string' }
                },
            };

            test('Object with no required', function () {
                const schema = deepCopy(baseSchema);

                let result = JsonSchemaValidator.validate({ name: 'John', age: 25 }, schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com' }, schema);
                assert.ok(result.valid);
            
                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra' }, schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate({}, schema);
                assert.ok(result.valid);
            });
            
            test('Object with required', function () {
                const schema = deepCopy(baseSchema);
                schema.required = ['name', 'age'];
                

                let result = JsonSchemaValidator.validate({}, schema);
                assert.ok(!result.valid);

                result = JsonSchemaValidator.validate({ name: 'John' }, schema);
                assert.ok(!result.valid);
                
                result = JsonSchemaValidator.validate({ age: 25 }, schema);
                assert.ok(!result.valid);
                
                result = JsonSchemaValidator.validate({ name: 'John', age: 25 }, schema);
                assert.ok(result.valid);

                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com' }, schema);
                assert.ok(result.valid);
            
                result = JsonSchemaValidator.validate({ name: 'John', age: 25, email: 'john@example.com', extra: 'extra' }, schema);
                assert.ok(result.valid);
            });
        });
    });
});
