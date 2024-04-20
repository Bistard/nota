import * as assert from 'assert';
import { ResourceMap, ResourceSet } from 'src/base/common/structures/map';
import { URI } from 'src/base/common/files/uri';
import { beforeEach } from 'mocha';

suite('ResourceMap', () => {

    test('ResourceMap - basics', function () {
		const map = new ResourceMap<any>();
        
		const resource1 = URI.parse('some://1');
		const resource2 = URI.parse('some://2');
		const resource3 = URI.parse('some://3');
		const resource4 = URI.parse('some://4');
		const resource5 = URI.parse('some://5');
		const resource6 = URI.parse('some://6');

		assert.strictEqual(map.size, 0);

		const res = map.set(resource1, 1);
		assert.ok(res === map);
		map.set(resource2, '2');
		map.set(resource3, true);

		const values = [...map.values()];
		assert.strictEqual(values[0], 1);
		assert.strictEqual(values[1], '2');
		assert.strictEqual(values[2], true);

		let counter = 0;
		map.forEach((value, key, mapObj) => {
			assert.strictEqual(value, values[counter++]);
			assert.ok(URI.isURI(key));
			assert.ok(map === mapObj);
		});

		const obj = Object.create(null);
		map.set(resource4, obj);

		const date = Date.now();
		map.set(resource5, date);

		assert.strictEqual(map.size, 5);
		assert.strictEqual(map.get(resource1), 1);
		assert.strictEqual(map.get(resource2), '2');
		assert.strictEqual(map.get(resource3), true);
		assert.strictEqual(map.get(resource4), obj);
		assert.strictEqual(map.get(resource5), date);
		assert.ok(!map.get(resource6));

		map.delete(resource6);
		assert.strictEqual(map.size, 5);
		assert.ok(map.delete(resource1));
		assert.ok(map.delete(resource2));
		assert.ok(map.delete(resource3));
		assert.ok(map.delete(resource4));
		assert.ok(map.delete(resource5));

		assert.strictEqual(map.size, 0);
		assert.ok(!map.get(resource5));
		assert.ok(!map.get(resource4));
		assert.ok(!map.get(resource3));
		assert.ok(!map.get(resource2));
		assert.ok(!map.get(resource1));

		map.set(resource1, 1);
		map.set(resource2, '2');
		map.set(resource3, true);

		assert.ok(map.has(resource1));
		assert.strictEqual(map.get(resource1), 1);
		assert.strictEqual(map.get(resource2), '2');
		assert.strictEqual(map.get(resource3), true);

		map.clear();

		assert.strictEqual(map.size, 0);
		assert.ok(!map.get(resource1));
		assert.ok(!map.get(resource2));
		assert.ok(!map.get(resource3));
		assert.ok(!map.has(resource1));

		map.set(resource1, false);
		map.set(resource2, 0);

		assert.ok(map.has(resource1));
		assert.ok(map.has(resource2));
	});

	test('ResourceMap - files (do NOT ignorecase)', function () {
		const map = new ResourceMap<any>();

		const fileA = URI.parse('file://some/filea');
		const fileB = URI.parse('some://some/other/fileb');
		const fileAUpper = URI.parse('file://SOME/FILEA');

		map.set(fileA, 'true');
		assert.strictEqual(map.get(fileA), 'true');

		assert.ok(!map.get(fileAUpper));

		assert.ok(!map.get(fileB));

		map.set(fileAUpper, 'false');
		assert.strictEqual(map.get(fileAUpper), 'false');

		assert.strictEqual(map.get(fileA), 'true');

		const windowsFile = URI.fromFile('c:\\test with %25\\c#code');
		const uncFile = URI.fromFile('\\\\shäres\\path\\c#\\plugin.json');

		map.set(windowsFile, 'true');
		map.set(uncFile, 'true');

		assert.strictEqual(map.get(windowsFile), 'true');
		assert.strictEqual(map.get(uncFile), 'true');
	});
});

suite('ResourceSet', () => {
    let resourceSet: ResourceSet;

    beforeEach(() => {
        resourceSet = new ResourceSet();
    });

    test('size should be 0 for a new ResourceSet', () => {
        assert.strictEqual(resourceSet.size, 0);
    });

    test('add should increase the size of the ResourceSet', () => {
        const uri = URI.parse('testScheme://testPath');
        resourceSet.add(uri);
        assert.strictEqual(resourceSet.size, 1);
    });

    test('delete should remove a resource and decrease the size', () => {
        const uri = URI.parse('testScheme://testPath');
        resourceSet.add(uri);
        const result = resourceSet.delete(uri);
        assert.strictEqual(result, true);
        assert.strictEqual(resourceSet.size, 0);
    });

    test('has should return true for added URIs', () => {
        const uri = URI.parse('testScheme://testPath');
        resourceSet.add(uri);
        assert.strictEqual(resourceSet.has(uri), true);
    });

    test('has should return false for non-existent URIs', () => {
        const uri = URI.parse('testScheme://testPath');
        assert.strictEqual(resourceSet.has(uri), false);
    });

    test('clear should remove all URIs and reset size to 0', () => {
        const uri1 = URI.parse('testScheme://testPath1');
        const uri2 = URI.parse('testScheme://testPath2');
        resourceSet.add(uri1);
        resourceSet.add(uri2);
        resourceSet.clear();
        assert.strictEqual(resourceSet.size, 0);
    });

    test('forEach should iterate over all URIs', () => {
        const uri1 = URI.parse('testScheme://testPath1');
        const uri2 = URI.parse('testScheme://testPath2');
        resourceSet.add(uri1);
        resourceSet.add(uri2);

        let count = 0;
        resourceSet.forEach(() => {
            count++;
        });

        assert.strictEqual(count, 2);
    });

    test('entries, keys, and values should provide correct iterators', () => {
        const uri = URI.parse('testScheme://testPath');
        resourceSet.add(uri);

        const entries = Array.from(resourceSet.entries());
        const keys = Array.from(resourceSet.keys());
        const values = Array.from(resourceSet.values());

        assert.deepStrictEqual(entries, [[uri, uri]]);
        assert.deepStrictEqual(keys, [uri]);
        assert.deepStrictEqual(values, [uri]);
    });

    test('Symbol.iterator should provide an iterator over the keys', () => {
        const uri = URI.parse('testScheme://testPath');
        resourceSet.add(uri);

        const keys = Array.from(resourceSet);
        assert.deepStrictEqual(keys, [uri]);
    });
});