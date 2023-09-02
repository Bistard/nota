import * as assert from 'assert';
import { ResourceMap } from 'src/base/common/structures/map';
import { URI } from 'src/base/common/files/uri';

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
