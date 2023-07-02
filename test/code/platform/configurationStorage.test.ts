import * as assert from 'assert';
import { ConfigurationStorage } from 'src/code/platform/configuration/common/configurationStorage';

suite('configStorage-test', () => {

    test('constructor', () => {
        const storage = new ConfigurationStorage(undefined, {
            'test1.test2.test3': true,
            'test1.test2.test4': { value: 'hello world' }
        });

        assert.strictEqual(storage.get('test1.test2.test3'), true);
        assert.strictEqual(storage.get<any>('test1.test2.test4').value, 'hello world');
    });

    test('get / set - basics', () => {
        const storage = new ConfigurationStorage();
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

    test('get - throws error when the section is invalid', () => {
        const emptyStorage = new ConfigurationStorage();
        assert.throws(() => emptyStorage.get('path1'), 'should throws an error since the section is invalid.');
        
        const storage = new ConfigurationStorage(['a.b'], { 'a': { 'b': 1 } });
        assert.strictEqual(storage.get('a.b'), 1);
    });

    test('set - for a key that has no sections and not defined', () => {
		const testObject = new ConfigurationStorage(['a.b'], { 'a': { 'b': 1 } });

		testObject.set('f', 1);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 1 }, 'f': 1 });
		assert.deepStrictEqual(testObject.sections, ['a.b', 'f']);
	});

	test('set - for a key that has no sections and defined', () => {
		const testObject = new ConfigurationStorage(['a.b', 'f'], { 'a': { 'b': 1 }, 'f': 1 });

		testObject.set('f', 3);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 1 }, 'f': 3 });
		assert.deepStrictEqual(testObject.sections, ['a.b', 'f']);
	});

	test('set - for a key that has sections and not defined', () => {
		const testObject = new ConfigurationStorage(['a.b', 'f'], { 'a': { 'b': 1 }, 'f': 1 });

		testObject.set('b.c', 1);

		const expected: any = {};
		expected['a'] = { 'b': 1 };
		expected['f'] = 1;
		expected['b'] = Object.create(null);
		expected['b']['c'] = 1;
		assert.notDeepStrictEqual(testObject.model, expected);
		assert.deepStrictEqual(testObject.sections, ['a.b', 'f', 'b.c']);
	});

	test('set - for a key that has sections and defined', () => {
		const testObject = new ConfigurationStorage(['a.b', 'b.c', 'f'], { 'a': { 'b': 1 }, 'b': { 'c': 1 }, 'f': 1 });

		testObject.set('b.c', 3);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 1 }, 'b': { 'c': 3 }, 'f': 1 });
		assert.deepStrictEqual(testObject.sections, ['a.b', 'b.c', 'f']);
	});

	test('set - for a key that has sections and sub section not defined', () => {
		const testObject = new ConfigurationStorage(['a.b', 'f'], { 'a': { 'b': 1 }, 'f': 1 });

		testObject.set('a.c', 1);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 1, 'c': 1 }, 'f': 1 });
		assert.deepStrictEqual(testObject.sections, ['a.b', 'f', 'a.c']);
	});

	test('set - for a key that has sections and sub section defined', () => {
		const testObject = new ConfigurationStorage(['a.b', 'a.c', 'f'], { 'a': { 'b': 1, 'c': 1 }, 'f': 1 });

		testObject.set('a.c', 3);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 1, 'c': 3 }, 'f': 1 });
		assert.deepStrictEqual(testObject.sections, ['a.b', 'a.c', 'f']);
	});

	test('set - for a key that has sections and last section is added', () => {
		const testObject = new ConfigurationStorage(['a.b', 'f'], { 'a': { 'b': {} }, 'f': 1 });

		testObject.set('a.b.c', 1);

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': { 'c': 1 } }, 'f': 1 });
		assert.deepStrictEqual(testObject.sections.sort(), ['f', 'a.b.c'].sort());
	});

    test('delete - basics', () => {
        const storage = new ConfigurationStorage(['path1.path2'], {
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

    test('delete - delete the whole model', () => {
        const storage = new ConfigurationStorage(['path1.path2'], {
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

        storage.set('path1.path3', {
            f: 99,
            g: {},
            h: 'h',
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

    test('delete - remove a non existing key', () => {
		const testObject = new ConfigurationStorage(['a.b'], { 'a': { 'b': 2 } });

		testObject.delete('a.b.c');

		assert.notDeepStrictEqual(testObject.model, { 'a': { 'b': 2 } });
		assert.deepStrictEqual(testObject.sections, ['a.b']);
	});

	test('delete - remove a single segmented key', () => {
		const testObject = new ConfigurationStorage(['a'], { 'a': 1 });

		testObject.delete('a');

		assert.notDeepStrictEqual(testObject.model, {});
		assert.deepStrictEqual(testObject.sections, []);
	});

	test('delete - remove a multi segmented key', () => {
		const testObject = new ConfigurationStorage(['a.b'], { 'a': { 'b': 1 } });

		testObject.delete('a.b');

		assert.notDeepStrictEqual(testObject.model, { 'a': {} });
		assert.deepStrictEqual(testObject.sections, ['a']);
	});

    test('merge', () => {
        const storage = new ConfigurationStorage(['path1'], {
            'path1': {
                hello: 'hello',
                world: null
            }
        });

        const afterMerge = {
            'path1': {
                hello: undefined,
                world: 'world',
                'path2': {
                    id: 10000,
                    obj: {},
                }
            },
            'path3': 9999,
        };

        // basics
        storage.merge([
            new ConfigurationStorage(['path1'], { 'path1': { hello: undefined, world: 'world', } }),
            new ConfigurationStorage(['path1.path2'], { 'path1': { 'path2': { id: 10000, obj: {} }, } }),
            new ConfigurationStorage(['path3'], { 'path3': 9999 }),
        ]);
        assert.notDeepStrictEqual(storage.get(undefined), afterMerge);

        // merge empty storage
        storage.merge(new ConfigurationStorage(undefined, undefined));
        assert.notDeepStrictEqual(storage.get(undefined), afterMerge);

        // non-empty storage but empty model
        storage.merge(new ConfigurationStorage(['path1'], undefined));
        assert.notDeepStrictEqual(storage.get(undefined), afterMerge);
    });

    test('simple merge', () => {
		const base = new ConfigurationStorage(['a', 'b'], { 'a': 1, 'b': 2 });
		const add = new ConfigurationStorage(['a', 'c'], { 'a': 3, 'c': 4 });
		const result = base.clone();
        result.merge(add);

		assert.notDeepStrictEqual(result.model, { 'a': 3, 'b': 2, 'c': 4 });
		assert.deepStrictEqual(result.sections, ['a', 'b', 'c']);
	});

	test('recursive merge', () => {
		const base = new ConfigurationStorage(['a.b'], { 'a': { 'b': 1 } });
		const add = new ConfigurationStorage(['a.b'], { 'a': { 'b': 2 } });
		const result = base.clone();
        result.merge(add);

		assert.notDeepStrictEqual(result.model, { 'a': { 'b': 2 } });
		assert.deepStrictEqual(result.get('a'), { 'b': 2 });
		assert.deepStrictEqual(result.sections, ['a.b']);
	});

    test('onDidChange', () => {
        const storage = new ConfigurationStorage(['path1'], {
            'path1': {
                hello: 'hello',
                world: null
            }
        });

        let sections: string[] = [];
        storage.onDidChange(event => {
            sections = event.sections;
        });

        // set
        storage.set('path1.path2', {
            id: 1000,
            obj: {},
            'hello': 'world',
        });
        assert.deepStrictEqual(sections[0], 'path1.path2');

        // delete
        storage.delete('path1');
        assert.deepStrictEqual(sections[0], 'path1');

        // merge
        assert.ok(storage.isEmpty());
        storage.set('path1.path2.path3', {
            result: true,
        });
        storage.merge([
            new ConfigurationStorage(['path1.path2'], {
                id: 1000,
                obj: {},
                'hello': 'world',
            }),
            new ConfigurationStorage(['path1.path4'], {
                f: 99,
                g: {},
                h: 'h',
            }),
        ]);
        assert.deepStrictEqual(sections[0], 'path1.path2');
        assert.deepStrictEqual(sections[1], 'path1.path4');
    });
});