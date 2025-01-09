import * as assert from 'assert';
import { memoize } from 'src/base/common/memoization';
import { nullable } from 'src/base/common/utilities/type';

suite('memoization', () => {

    test('memoize - class method', () => {
        class Foo {
			public count = 0;

			constructor(private _answer: number | nullable) { }
			
            @memoize 
            public answer(): number | nullable {
				this.count++;
				return this._answer;
			}
		}

		const foo = new Foo(42);
		assert.strictEqual(foo.count, 0);
		assert.strictEqual(foo.answer(), 42);
		assert.strictEqual(foo.count, 1);
		assert.strictEqual(foo.answer(), 42);
		assert.strictEqual(foo.count, 1);

		const foo2 = new Foo(1337);
		assert.strictEqual(foo2.count, 0);
		assert.strictEqual(foo2.answer(), 1337);
		assert.strictEqual(foo2.count, 1);
		assert.strictEqual(foo2.answer(), 1337);
		assert.strictEqual(foo2.count, 1);

		assert.strictEqual(foo.answer(), 42);
		assert.strictEqual(foo.count, 1);

		const foo3 = new Foo(null);
		assert.strictEqual(foo3.count, 0);
		assert.strictEqual(foo3.answer(), null);
		assert.strictEqual(foo3.count, 1);
		assert.strictEqual(foo3.answer(), null);
		assert.strictEqual(foo3.count, 1);

		const foo4 = new Foo(undefined);
		assert.strictEqual(foo4.count, 0);
		assert.strictEqual(foo4.answer(), undefined);
		assert.strictEqual(foo4.count, 1);
		assert.strictEqual(foo4.answer(), undefined);
		assert.strictEqual(foo4.count, 1);
    });

    test('memoize - class getter', () => {
        class Foo {
			public count = 0;

			constructor(private _answer: number | nullable) { }

			@memoize
			get answer(): number | nullable {
				this.count++;
				return this._answer;
			}
		}

		const foo = new Foo(42);
		assert.strictEqual(foo.count, 0);
		assert.strictEqual(foo.answer, 42);
		assert.strictEqual(foo.count, 1);
		assert.strictEqual(foo.answer, 42);
		assert.strictEqual(foo.count, 1);

		const foo2 = new Foo(1337);
		assert.strictEqual(foo2.count, 0);
		assert.strictEqual(foo2.answer, 1337);
		assert.strictEqual(foo2.count, 1);
		assert.strictEqual(foo2.answer, 1337);
		assert.strictEqual(foo2.count, 1);

		assert.strictEqual(foo.answer, 42);
		assert.strictEqual(foo.count, 1);

		const foo3 = new Foo(null);
		assert.strictEqual(foo3.count, 0);
		assert.strictEqual(foo3.answer, null);
		assert.strictEqual(foo3.count, 1);
		assert.strictEqual(foo3.answer, null);
		assert.strictEqual(foo3.count, 1);

		const foo4 = new Foo(undefined);
		assert.strictEqual(foo4.count, 0);
		assert.strictEqual(foo4.answer, undefined);
		assert.strictEqual(foo4.count, 1);
		assert.strictEqual(foo4.answer, undefined);
		assert.strictEqual(foo4.count, 1);
    });

});