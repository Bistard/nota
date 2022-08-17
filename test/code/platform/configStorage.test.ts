import * as assert from 'assert';
import { ConfigStorage } from 'src/code/platform/configuration/common/configStorage';

suite('configStorage-test', () => {

    test('get / set', () => {
        const storage = new ConfigStorage();
        assert.strictEqual(storage.isEmpty(), true);

        storage.set('path1', {
            hello: 'hello',
            world: null,
        });
        assert.strictEqual(storage.isEmpty(), false);

        let config = storage.get<any>('path1');
        assert.deepStrictEqual(config, {
            hello: 'hello',
            world: null,
        });

        storage.set('path1.path2', {
            a: 100,
            b: false,
            c: {
                d: undefined
            }
        });

        config = storage.get<any>('path1');
        assert.deepStrictEqual(config, {
            hello: 'hello',
            world: null,
            'path2': {
                a: 100,
                b: false,
                c: {
                    d: undefined
                },
            },
        });

        config = storage.get<any>('path1.path2');
        assert.deepStrictEqual(config, {
            a: 100,
            b: false,
            c: {
                d: undefined
            },
        });
    });

    test('delete', () => {
        const storage = new ConfigStorage(['path1.path2'], {
            'path1': {
                hello: 'hello',
                world: null,
                'path2': {
                    a: 100,
                    b: false,
                    c: {
                        d: undefined
                    },
                },
            }
        });

        storage.delete('path1.path2');
        assert.strictEqual(storage.isEmpty(), false);
        try {
            storage.get('path1.path2');
            assert.fail('should not be reached');
        } catch {
            assert.ok(true);
        }

        assert.deepStrictEqual(storage.get('path1'), {
            hello: 'hello',
            world: null,
        });

        storage.delete('path1');
        try {
            storage.get('path1');
            assert.fail('should not be reached');
        } catch {
            assert.ok(true);
        }
        assert.strictEqual(storage.isEmpty(), true);
    });

    test('merge', () => {
        const storage = new ConfigStorage(['path1'], {
            'path1': {
                hello: 'hello',
                world: null
            }
        });

        storage.merge(
            new ConfigStorage(['path1'], { 'path1': { hello: undefined, world: 'world', } }),
            new ConfigStorage(['path1.path2'], { 'path1': { 'path2': { id: 10000, obj: {} }, } }),
            new ConfigStorage(['path3'], { 'path3': 9999 })
        );
        assert.deepStrictEqual(storage.get(), {
            'path1': {
                hello: undefined,
                world: 'world',
                'path2': {
                    id: 10000,
                    obj: {},
                }
            },
            'path3': 9999,
        });
    });
});