import * as assert from 'assert';
import { ContextKeyDeserializer, ContextKeyExpr, CreateContextKeyExpr } from 'src/code/platform/context/common/contextKeyExpr';

function createContext(ctx: any) {
	return {
		getValue: (key: string) => {
			return ctx[key];
		}
	};
}

suite('context-key-expression-test', () => {
	test('equal', () => {
		const a = CreateContextKeyExpr.And(
			CreateContextKeyExpr.Has('a1'),
			CreateContextKeyExpr.And(CreateContextKeyExpr.Has('and.a')),
			CreateContextKeyExpr.Has('a2'),
			CreateContextKeyExpr.Regex('d3', /d.*/),
			CreateContextKeyExpr.Regex('d4', /\*\*3*/),
			CreateContextKeyExpr.Equal('b1', 'bb1'),
			CreateContextKeyExpr.Equal('b2', 'bb2'),
			CreateContextKeyExpr.NotEqual('c1', 'cc1'),
			CreateContextKeyExpr.NotEqual('c2', 'cc2'),
			CreateContextKeyExpr.Not('d1'),
			CreateContextKeyExpr.Not('d2')
		)!;
		const b = CreateContextKeyExpr.And(
			CreateContextKeyExpr.Equal('b2', 'bb2'),
			CreateContextKeyExpr.NotEqual('c1', 'cc1'),
			CreateContextKeyExpr.Not('d1'),
			CreateContextKeyExpr.Regex('d4', /\*\*3*/),
			CreateContextKeyExpr.NotEqual('c2', 'cc2'),
			CreateContextKeyExpr.Has('a2'),
			CreateContextKeyExpr.Equal('b1', 'bb1'),
			CreateContextKeyExpr.Regex('d3', /d.*/),
			CreateContextKeyExpr.Has('a1'),
			CreateContextKeyExpr.And(CreateContextKeyExpr.Equal('and.a', true)),
			CreateContextKeyExpr.Not('d2')
		)!;
		assert.ok(a.equal(b), 'expressions should be equal');
	});

	test('Equal in comparator expressions', () => {
		function testEquals(expr: ContextKeyExpr, str: string): void {
			const deserialized = ContextKeyDeserializer.deserialize(str);
			assert.ok(expr);
			assert.ok(deserialized);
			assert.strictEqual(expr.equal(deserialized), true, str);
		}
		testEquals(CreateContextKeyExpr.Greater('value', 0), 'value > 0');
		testEquals(CreateContextKeyExpr.GreaterEqual('value', 0), 'value >= 0');
		testEquals(CreateContextKeyExpr.Smaller('value', 0), 'value < 0');
		testEquals(CreateContextKeyExpr.SmallerEqual('value', 0), 'value <= 0');
	});

	test('normalize', () => {
		const key1IsTrue = CreateContextKeyExpr.Equal('key1', true);
		const key1IsNotFalse = CreateContextKeyExpr.NotEqual('key1', false);
		const key1IsFalse = CreateContextKeyExpr.Equal('key1', false);
		const key1IsNotTrue = CreateContextKeyExpr.NotEqual('key1', true);

		assert.ok(key1IsTrue.equal(CreateContextKeyExpr.Has('key1')));
		assert.ok(key1IsNotFalse.equal(CreateContextKeyExpr.Has('key1')));
		assert.ok(key1IsFalse.equal(CreateContextKeyExpr.Not('key1')));
		assert.ok(key1IsNotTrue.equal(CreateContextKeyExpr.Not('key1')));
	});

	test('evaluate', () => {
		const context = createContext({
			'a': true,
			'b': false,
			'c': '5',
			'd': 'd'
		});
		
		function testExpression(expr: string, expected: boolean): void {
			const rules = ContextKeyDeserializer.deserialize(expr);
			assert.strictEqual(rules.evaluate(context), expected, expr);
		}

		function testBatch(expr: string, value: any): void {
			testExpression(expr, !!value);
			testExpression(expr + ' == true', !!value);
			testExpression(expr + ' != true', !value);
			testExpression(expr + ' == false', !value);
			testExpression(expr + ' != false', !!value);
			testExpression(expr + ' == 5', value == <any>'5');
			testExpression(expr + ' != 5', value != <any>'5');
			testExpression('!' + expr, !value);
			testExpression(expr + ' =~ /d.*/', /d.*/.test(value));
			testExpression(expr + ' =~ /D/i', /D/i.test(value));
		}

		testBatch('a', true);
		testBatch('b', false);
		testBatch('c', '5');
		testBatch('d', 'd');
		testBatch('z', undefined);

		testExpression('true', true);
		testExpression('false', false);
		testExpression('a && !b', true && !false);
		testExpression('a && b', true && false);
		testExpression('a && !b && c == 5', true && !false && '5' === '5');
		testExpression('d =~ /e.*/', false);

		// precedence test: false && true || true === true because && is evaluated first
		testExpression('b && a || a', true);

		testExpression('a || b', true);
		testExpression('b || b', false);
		testExpression('b && a || a && b', false);
	});

	test('negate', () => {
		function testNegate(expr: string, expected: string): void {
			const actual = ContextKeyDeserializer.deserialize(expr)!.negate().serialize();
			assert.strictEqual(actual, expected);
		}
		testNegate('true', 'false');
		testNegate('false', 'true');
		testNegate('a', '!a');
		testNegate('a && b || c', '!a && !c || !b && !c');
		testNegate('a && b || c || d', '!a && !c && !d || !b && !c && !d');
		testNegate('!a && !b || !c && !d', 'a && c || a && d || b && c || b && d');
		testNegate('!a && !b || !c && !d || !e && !f', 'a && c && e || a && c && f || a && d && e || a && d && f || b && c && e || b && c && f || b && d && e || b && d && f');
	});

	test('false, true, and, or', () => {
		function testNormalize(expr: string, expected: string): void {
			const expression = ContextKeyDeserializer.deserialize(expr);
			const actual = expression.serialize();
			assert.strictEqual(actual, expected);
		}
		testNormalize('true', 'true');
		testNormalize('!true', 'false');
		testNormalize('false', 'false');
		testNormalize('!false', 'true');
		testNormalize('a && true', 'a');
		testNormalize('a && false', 'false');
		testNormalize('a || true', 'true');
		testNormalize('a || false', 'a');
	});

	test('distribute OR', () => {
		function t(expr1: string, expr2: string, expected: string | undefined): void {
			const e1 = ContextKeyDeserializer.deserialize(expr1);
			const e2 = ContextKeyDeserializer.deserialize(expr2);
			const actual = CreateContextKeyExpr.And(e1, e2).serialize();
			assert.strictEqual(actual, expected);
		}
		t('a', 'b', 'a && b');
		t('a || b', 'c', 'a && c || b && c');
		t('a || b', 'c || d', 'a && c || a && d || b && c || b && d');
		t('a || b', 'c && d', 'a && c && d || b && c && d');
		t('a || b', 'c && d || e', 'a && e || b && e || a && c && d || b && c && d');
	});

	test('ContextKeyInExpr', () => {
		const ainb = ContextKeyDeserializer.deserialize('a in b');
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [3, 2, 1] })), true);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [1, 2, 3] })), true);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': [1, 2] })), false);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 3 })), false);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 3, 'b': null })), false);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': ['x'] })), true);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': ['y'] })), false);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': {} })), false);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': { 'x': false } })), true);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'x', 'b': { 'x': true } })), true);
		assert.strictEqual(ainb.evaluate(createContext({ 'a': 'prototype', 'b': {} })), false);
	});

	test('distributing AND should normalize', () => {
		const actual = CreateContextKeyExpr.And(
			CreateContextKeyExpr.Or(
				CreateContextKeyExpr.Has('a'),
				CreateContextKeyExpr.Has('b')
			),
			CreateContextKeyExpr.Has('c')
		);
		const expected = CreateContextKeyExpr.Or(
			CreateContextKeyExpr.And(
				CreateContextKeyExpr.Has('a'),
				CreateContextKeyExpr.Has('c')
			),
			CreateContextKeyExpr.And(
				CreateContextKeyExpr.Has('b'),
				CreateContextKeyExpr.Has('c')
			)
		);
		assert.strictEqual(actual!.equal(expected!), true);
	});

	test('Removes duplicated terms in OR expressions', () => {
		const expr = CreateContextKeyExpr.Or(
			CreateContextKeyExpr.Has('A'),
			CreateContextKeyExpr.Has('B'),
			CreateContextKeyExpr.Has('A')
		)!;
		assert.strictEqual(expr.serialize(), 'A || B');
	});

	test('Removes duplicated terms in AND expressions', () => {
		const expr = CreateContextKeyExpr.And(
			CreateContextKeyExpr.Has('A'),
			CreateContextKeyExpr.Has('B'),
			CreateContextKeyExpr.Has('A')
		)!;
		assert.strictEqual(expr.serialize(), 'A && B');
	});

	test('Remove duplicated terms when negating', () => {
		const expr = CreateContextKeyExpr.And(
			CreateContextKeyExpr.Has('A'),
			CreateContextKeyExpr.Or(
				CreateContextKeyExpr.Has('B1'),
				CreateContextKeyExpr.Has('B2'),
			)
		)!;
		assert.strictEqual(expr.serialize(), 'A && B1 || A && B2');
		assert.strictEqual(expr.negate()!.serialize(), '!A || !B1 && !B2');
		assert.strictEqual(expr.negate()!.negate()!.serialize(), 'A && B1 || A && B2');
		assert.strictEqual(expr.negate()!.negate()!.negate()!.serialize(), '!A || !B1 && !B2');
	});

	test('remove redundant terms in OR expressions', () => {
		function strImplies(p0: string, q0: string): boolean {
			const p = ContextKeyDeserializer.deserialize(p0);
			const q = ContextKeyDeserializer.deserialize(q0);
			return p.imply(q);
		}
		assert.strictEqual(strImplies('a', 'a && b'), true);
	});

	test('evaluate - Greater, GreaterEquals, Smaller, SmallerEquals', () => {
		function checkEvaluate(expr: string, ctx: any, expected: any): void {
			const _expr = ContextKeyDeserializer.deserialize(expr);
			assert.strictEqual(_expr.evaluate(createContext(ctx)), expected);
		}

		checkEvaluate('a>1', {}, false);
		checkEvaluate('a>1', { a: 0 }, false);
		checkEvaluate('a>1', { a: 1 }, false);
		checkEvaluate('a>1', { a: 2 }, true);
		checkEvaluate('a>1', { a: '0' }, false);
		checkEvaluate('a>1', { a: '1' }, false);
		checkEvaluate('a>1', { a: '2' }, true);
		checkEvaluate('a>1', { a: 'a' }, false);

		checkEvaluate('a>10', { a: 2 }, false);
		checkEvaluate('a>10', { a: 11 }, true);
		checkEvaluate('a>10', { a: '11' }, true);
		checkEvaluate('a>10', { a: '2' }, false);
		checkEvaluate('a>10', { a: '11' }, true);

		checkEvaluate('a>1.1', { a: 1 }, false);
		checkEvaluate('a>1.1', { a: 2 }, true);
		checkEvaluate('a>1.1', { a: 11 }, true);
		checkEvaluate('a>1.1', { a: '1.1' }, false);
		checkEvaluate('a>1.1', { a: '2' }, true);
		checkEvaluate('a>1.1', { a: '11' }, true);

		checkEvaluate('a>b', { a: 'b' }, false);
		checkEvaluate('a>b', { a: 'c' }, false);
		checkEvaluate('a>b', { a: 1000 }, false);

		checkEvaluate('a >= 2', { a: '1' }, false);
		checkEvaluate('a >= 2', { a: '2' }, true);
		checkEvaluate('a >= 2', { a: '3' }, true);

		checkEvaluate('a < 2', { a: '1' }, true);
		checkEvaluate('a < 2', { a: '2' }, false);
		checkEvaluate('a < 2', { a: '3' }, false);

		checkEvaluate('a <= 2', { a: '1' }, true);
		checkEvaluate('a <= 2', { a: '2' }, true);
		checkEvaluate('a <= 2', { a: '3' }, false);
	});

	test('negate - Greater, GreaterEquals, Smaller, SmallerEquals', () => {
		function checkNegate(expr: string, expected: string): void {
			const a = ContextKeyDeserializer.deserialize(expr);
			const b = a.negate();
			assert.strictEqual(b.serialize(), expected);
		}

		checkNegate('a>1', 'a <= 1');
		checkNegate('a>1.1', 'a <= 1.1');
		checkNegate('a>b', 'a <= b');

		checkNegate('a>=1', 'a < 1');
		checkNegate('a>=1.1', 'a < 1.1');
		checkNegate('a>=b', 'a < b');

		checkNegate('a<1', 'a >= 1');
		checkNegate('a<1.1', 'a >= 1.1');
		checkNegate('a<b', 'a >= b');

		checkNegate('a<=1', 'a > 1');
		checkNegate('a<=1.1', 'a > 1.1');
		checkNegate('a<=b', 'a > b');
	});

	test('context keys can use `<` or `>`', () => {
		const actual = ContextKeyDeserializer.deserialize('editorTextFocus && vim.active && vim.use<C-r>');
		assert.ok(actual.equal(
			CreateContextKeyExpr.And(
				CreateContextKeyExpr.Has('editorTextFocus'),
				CreateContextKeyExpr.Has('vim.active'),
				CreateContextKeyExpr.Has('vim.use<C-r>'),
			)!
		));
	});
});
