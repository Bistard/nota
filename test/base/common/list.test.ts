import * as assert from 'assert';
import { List } from 'src/base/common/list';

suite('list-test', () => {

    function assertElements<E>(list: List<E>, ...elements: E[]) {

		// check size
		assert.strictEqual(list.size(), elements.length);

		// assert toArray
		assert.deepStrictEqual(Array.from(list), elements);

		// assert Symbol.iterator (1)
		assert.deepStrictEqual([...list], elements);

		// assert Symbol.iterator (2)
		for (const item of list) {
			assert.strictEqual(item, elements.shift());
		}
		assert.strictEqual(elements.length, 0);
	}

    test('initializer constructor / clear / size / iterable', () => {
        const list = new List<number>(0, 1, 2, 3, 4, 5);
        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 5);
        
        assertElements(list, 0, 1, 2, 3, 4, 5);
        list.clear();

        assert.strictEqual(list.front(), undefined);
        assert.strictEqual(list.back(), undefined);
        assertElements(list);
    });

	test('push_front / push_back', () => {
		const list = new List<number>();
        list.push_front(2);
        list.push_front(1);
        list.push_front(0);
        assertElements(list, 0, 1, 2);

        list.push_back(3);
		list.push_back(4);
        list.push_back(5);
		assertElements(list, 0, 1, 2, 3, 4, 5);
	});

    test('pop_front / pop_end', () => {
        const list = new List<number>(1, 2, 3, 4, 5);
        
        assert.strictEqual(list.pop_front()?.data, 1);
        assert.strictEqual(list.pop_back()?.data, 5);
        assertElements(list, 2, 3, 4);

        assert.strictEqual(list.pop_front()?.data, 2);
        assert.strictEqual(list.pop_back()?.data, 4);
        assertElements(list, 3);

        assert.strictEqual(list.pop_front()?.data, 3);
        assert.strictEqual(list.pop_back(), undefined);
        assertElements(list);
    });

    test('remove', () => {
        const list = new List<number>();

        const num2 = list.push_front(2);
        const num1 = list.push_front(1);
        const num0 = list.push_front(0);
        const num3 = list.push_back(3);
		const num4 = list.push_back(4);
        const num5 = list.push_back(5);

        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 5);
        assertElements(list, 0, 1, 2, 3, 4, 5);

        list.remove(num1);
        assertElements(list, 0, 2, 3, 4, 5);

        list.remove(num5);
        assertElements(list, 0, 2, 3, 4);

        list.remove(num3);
        assertElements(list, 0, 2, 4);

        list.remove(num0);
        assertElements(list, 2, 4);

        list.remove(num4);
        assertElements(list, 2);

        list.remove(num2);
        assertElements(list);
    });

    test('insert', () => {
        const list = new List<number>();

        const num2 = list.push_front(2);
        const num1 = list.push_front(1);
        const num0 = list.push_front(0);
        const num3 = list.push_back(3);
		const num4 = list.push_back(4);
        const num5 = list.push_back(5);

        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 5);
        assertElements(list, 0, 1, 2, 3, 4, 5);

        list.insert(num0, -1);
        assert.strictEqual(list.front()?.data, -1);
        assertElements(list, -1, 0, 1, 2, 3, 4, 5);

        list.insert(num1, 0.5);
        assert.strictEqual(list.front()?.data, -1);
        assertElements(list, -1, 0, 0.5, 1, 2, 3, 4, 5);

        list.insert(num5, 4.5);
        assert.strictEqual(list.back()?.data, 5);
        assertElements(list, -1, 0, 0.5, 1, 2, 3, 4, 4.5, 5);
    });

	test('front / back', () => {
        const list = new List<number>();

        list.push_front(2);
        assert.strictEqual(list.front()?.data, 2);
        assert.strictEqual(list.back()?.data, 2);

        list.push_front(1);
        assert.strictEqual(list.front()?.data, 1);
        assert.strictEqual(list.back()?.data, 2);

        list.push_front(0);
        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 2);

        list.push_back(3);
        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 3);

		list.push_back(4);
        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 4);

        list.push_back(5);
        assert.strictEqual(list.front()?.data, 0);
        assert.strictEqual(list.back()?.data, 5);
    });

    test('exist', () => {
        const list = new List<number>(1, 2, 3, 4, 5);

        assert.strictEqual(list.exist(0), false);
        assert.strictEqual(list.exist(1), true);
        assert.strictEqual(list.exist(3), true);
        assert.strictEqual(list.exist(5), true);
        assert.strictEqual(list.exist(6), false);
    });
});