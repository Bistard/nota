/* eslint-disable local/code-interface-check */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/ban-types */

import * as assert from 'assert';
import { LinkedList } from 'src/base/common/structures/linkedList';
import { AlphabetInString, AlphabetInStringCap, AlphabetInStringLow, AnyOf, AreEqual, Comparator, ConcatArray, Constructor, DeepMutable, DeepReadonly, Dictionary, DightInString, IsArray, IsBoolean, IsNull, IsNumber, IsObject, IsString, IsTruthy, MapTypes, Mutable, Negate, NestedArray, NonUndefined, nullToUndefined, NumberDictionary, Pair, Pop, Promisify, Push, Single, SplitString, StringDictionary, Triple, ifOrDefault, isBoolean, isEmptyObject, isIterable, isNonNullable, isNullable, isNumber, isObject, isPrimitive, isPromise, checkTrue, checkFalse, IsAny, IsNever, Or, NonEmptyArray, AtMostNArray, Falsy, NonFalsy, ArrayType, Flatten, AtLeastNArray, isTruthy, isFalsy, TupleOf, ExactConstructor, toBoolean, ReplaceType } from 'src/base/common/utilities/type';

suite('type-test', () => {

    suite('isTruthy', () => {
        test('should return true for truthy values', () => {
            assert.strictEqual(isTruthy(true), true);
            assert.strictEqual(isTruthy(1), true);
            assert.strictEqual(isTruthy('non-empty'), true);
            assert.strictEqual(isTruthy([]), true);
            assert.strictEqual(isTruthy({}), true);
            assert.strictEqual(isTruthy(() => {}), true);
        });
    
        test('should return false for falsy values', () => {
            assert.strictEqual(isTruthy(false), false);
            assert.strictEqual(isTruthy(0), false);
            assert.strictEqual(isTruthy(''), false);
            assert.strictEqual(isTruthy(null), false);
            assert.strictEqual(isTruthy(undefined), false);
            assert.strictEqual(isTruthy(NaN), false);
        });
    });
    
    suite('isFalsy', () => {
        test('should return false for truthy values', () => {
            assert.strictEqual(isFalsy(true), false);
            assert.strictEqual(isFalsy(1), false);
            assert.strictEqual(isFalsy('non-empty'), false);
            assert.strictEqual(isFalsy([]), false);
            assert.strictEqual(isFalsy({}), false);
            assert.strictEqual(isFalsy(() => {}), false);
        });
    
        test('should return true for falsy values', () => {
            assert.strictEqual(isFalsy(false), true);
            assert.strictEqual(isFalsy(0), true);
            assert.strictEqual(isFalsy(''), true);
            assert.strictEqual(isFalsy(null), true);
            assert.strictEqual(isFalsy(undefined), true);
            assert.strictEqual(isFalsy(NaN), true);
        });
    });

    test('isPrimitive', () => {
        assert.strictEqual(isPrimitive(0), true);
        assert.strictEqual(isPrimitive(1), true);
        assert.strictEqual(isPrimitive(-1), true);
        assert.strictEqual(isPrimitive(NaN), true);
        assert.strictEqual(isPrimitive(false), true);
        assert.strictEqual(isPrimitive(true), true);
        assert.strictEqual(isPrimitive(''), true);
        assert.strictEqual(isPrimitive('hello world'), true);
        assert.strictEqual(isPrimitive(undefined), true);
        assert.strictEqual(isPrimitive(null), true);
        assert.strictEqual(isPrimitive(Symbol(0)), true);
        assert.strictEqual(isPrimitive(Symbol('')), true);
        assert.strictEqual(isPrimitive(Symbol(undefined)), true);
        assert.strictEqual(isPrimitive({}), false);
        assert.strictEqual(isPrimitive([]), false);
        assert.strictEqual(isPrimitive(new Date()), false);
        assert.strictEqual(isPrimitive(new RegExp('')), false);
        assert.strictEqual(isPrimitive(() => { }), false);
        assert.strictEqual(isPrimitive(function () { }), false);
        assert.strictEqual(isPrimitive(3), true);
        assert.strictEqual(isPrimitive('abc'), true);
        assert.strictEqual(isPrimitive({}), false);
        assert.strictEqual(isPrimitive(null), true);
        assert.strictEqual(isPrimitive(undefined), true);
    });

    test('isNumber', () => {
        assert.strictEqual(isNumber(undefined), false);
        assert.strictEqual(isNumber(null), false);
        assert.strictEqual(isNumber(''), false);
        assert.strictEqual(isNumber(NaN), false);
        assert.strictEqual(isNumber(0), true);
        assert.strictEqual(isNumber(1), true);
        assert.strictEqual(isNumber(-1), true);
        assert.strictEqual(isNumber(9999), true);
    });

    test('isBoolean', () => {
        assert.strictEqual(isBoolean(true), true);
        assert.strictEqual(isBoolean(false), true);
        assert.strictEqual(isBoolean('true'), false);
    });
    
    suite('toBoolean', () => {
        test('should return true for string "true" (case insensitive)', () => {
            assert.strictEqual(toBoolean("true"), true);
            assert.strictEqual(toBoolean("TRUE"), true);
            assert.strictEqual(toBoolean("TrUe"), true);
        });
    
        test('should return false for string "false" (case insensitive)', () => {
            assert.strictEqual(toBoolean("false"), false);
            assert.strictEqual(toBoolean("FALSE"), false);
            assert.strictEqual(toBoolean("FaLsE"), false);
        });
    
        test('should return false for non-boolean strings', () => {
            assert.strictEqual(toBoolean("hello"), false);
            assert.strictEqual(toBoolean("123"), false);
            assert.strictEqual(toBoolean(""), false);
        });
    
        test('should return true for boolean true', () => {
            assert.strictEqual(toBoolean(true), true);
        });
    
        test('should return false for boolean false', () => {
            assert.strictEqual(toBoolean(false), false);
        });
    
        test('should return false for undefined or null', () => {
            assert.strictEqual(toBoolean(undefined), false);
            assert.strictEqual(toBoolean(null), false);
        });
    
        test('should return false for number 0', () => {
            assert.strictEqual(toBoolean(0), false);
        });
    
        test('should return true for non-zero numbers', () => {
            assert.strictEqual(toBoolean(1), true);
            assert.strictEqual(toBoolean(-1), true);
            assert.strictEqual(toBoolean(42), true);
        });
    
        test('should return true for truthy objects', () => {
            assert.strictEqual(toBoolean({}), true);
            assert.strictEqual(toBoolean([]), true);
        });
    
        test('should return false for empty or falsy values', () => {
            assert.strictEqual(toBoolean(NaN), false);
            assert.strictEqual(toBoolean(''), false);
        });
    });

    test('isObject', () => {
        assert.strictEqual(isObject(undefined), false);
        assert.strictEqual(isObject(null), false);
        assert.strictEqual(isObject(''), false);
        assert.strictEqual(isObject(NaN), false);
        assert.strictEqual(isObject([]), false);
        assert.strictEqual(isObject(new RegExp('')), false);
        assert.strictEqual(isObject(new Date()), false);
        assert.strictEqual(isObject({}), true);
        assert.strictEqual(isObject({ a: 5 }), true);
    });

    test('isEmptyObject', () => {
        assert.strictEqual(isEmptyObject({}), true);
        assert.strictEqual(isEmptyObject({ a: 5 }), false);
    });

    test('isIterable', () => {
        assert.strictEqual(isIterable(new LinkedList()), true);
        assert.strictEqual(isIterable([]), true);
        assert.strictEqual(isIterable({}), false);
        assert.strictEqual(isIterable([1, 2, 3]), true);
        assert.strictEqual(isIterable('Hello'), true);
    });

    test('isPromise', () => {
        assert.strictEqual(isPromise(Promise.resolve()), true);
        assert.strictEqual(isPromise(new Promise(() => { })), true);
        assert.strictEqual(isPromise({ then: () => { } }), false);
        assert.strictEqual(isPromise({ then() { }, catch() { }, finally() { } }), true);
    });

    test('isNullable', () => {
        assert.strictEqual(isNullable(null), true);
        assert.strictEqual(isNullable(undefined), true);
        assert.strictEqual(isNullable(''), false);
        assert.strictEqual(isNullable(0), false);
    });

    test('isNonNullable', () => {
        assert.strictEqual(isNonNullable(null), false);
        assert.strictEqual(isNonNullable(undefined), false);
        assert.strictEqual(isNonNullable(''), true);
        assert.strictEqual(isNonNullable(0), true);
    });

    test('nullToUndefined', () => {
        assert.strictEqual(nullToUndefined(null), undefined);
        assert.strictEqual(nullToUndefined(undefined), undefined);
        assert.strictEqual(nullToUndefined(0), 0);
        assert.strictEqual(nullToUndefined(''), '');
        assert.strictEqual(nullToUndefined(-1), -1);
        assert.strictEqual(nullToUndefined(false), false);
        assert.strictEqual(nullToUndefined('null'), 'null');
    });

    test('ifOrDefault', () => {
        assert.strictEqual(ifOrDefault<string>(undefined!, 'default'), 'default');
        assert.strictEqual(ifOrDefault<string>(null!, 'default'), 'default');
        assert.strictEqual(ifOrDefault<string>('value', 'default'), 'value');
    });
});

suite('typescript-types-test', () => {

    test('Falsy type', () => {
        // Tests for Falsy - asserting that these should not error as they are Falsy types
        const falsyFalse: Falsy = false;
        const falsyNull: Falsy = null;
        const falsyUndefined: Falsy = undefined;
        const falsyZero: Falsy = 0;
        const falsyNegativeZero: Falsy = -0;
        const falsyBigIntZero: Falsy = 0n;
        const falsyEmptyString: Falsy = '';

        // @ts-expect-error
        let expectErr: Falsy = 5;
        // @ts-expect-error
        expectErr = true;
        // @ts-expect-error
        expectErr = 'hi';
        // @ts-expect-error
        expectErr = {};
        // @ts-expect-error
        expectErr = [];
    });

    test('Non-Falsy type', () => {
        // Should pass
        const nonFalsyString: NonFalsy<string> = 'hello';
        const nonFalsyNumber: NonFalsy<number> = 123;
        const nonFalsyObject: NonFalsy<object> = {};
        const nonFalsyArray: NonFalsy<number[]> = [];

        // Should fail
        // @ts-expect-error
        const nonFalsyFalse: NonFalsy<false> = false;
        // @ts-expect-error
        const nonFalsyNull: NonFalsy<null> = null;
        // @ts-expect-error
        const nonFalsyUndefined: NonFalsy<undefined> = undefined;
        // @ts-expect-error
        const nonFalsyZero: NonFalsy<0> = 0;
        // @ts-expect-error
        const nonFalsyEmptyString: NonFalsy<''> = '';
    });

    test('DightInString type', () => {
        const digit: DightInString = '5';
    });

    test('AlphabetInStringLow type', () => {
        const char: AlphabetInStringLow = 'g';
    });

    test('AlphabetInStringCap type', () => {
        const char: AlphabetInStringCap = 'G';
    });

    test('AlphabetInString type', () => {
        const char: AlphabetInString = 'A';
        const char2: AlphabetInString = 'a';
    });

    test('NonUndefined type', () => {
        const obj: NonUndefined = {};
    });

    test('Negate type', () => {
        checkTrue<Negate<false>>();
        checkFalse<Negate<true>>();
    });

    test('IsNever type', () => {
        checkTrue<IsNever<never>>();
        checkFalse<IsNever<undefined>>();
        checkFalse<IsNever<null>>();
        checkFalse<IsNever<''>>();
        checkFalse<IsNever<0>>();
        checkFalse<IsNever<[]>>();
        checkFalse<IsNever<{}>>();
        checkFalse<IsNever<'hello world'>>();
    });
    
    test('Or type', () => {
        checkTrue<Or<never, true>>();
        checkTrue<Or<null, true>>();
        checkTrue<Or<undefined, true>>();
        
        checkFalse<Or<never, false>>();
        checkFalse<Or<null, false>>();
        checkFalse<Or<undefined, false>>();
        
        checkTrue<Or<true, false>>();
        checkTrue<Or<true, null>>();
        checkTrue<Or<true, undefined>>();
    });

    test('AnyOf type', () => {
        checkTrue<AnyOf<[0, "", null, 5]>>();
        checkFalse<AnyOf<[0, "", null]>>();
    });

    test('Push type', () => {
        checkTrue<AreEqual<
            Push<[1, 2, 3], 4>, 
            [1, 2, 3, 4]
        >>();
    });

    test('Pop type', () => {
        checkTrue<AreEqual<
            Pop<[1, 2, 3, 4]>, 
            [1, 2, 3]
        >>();
    });

    test('ArrayType', () => {
        checkTrue<AreEqual<ArrayType<number[]>, number>>();
        checkTrue<AreEqual<ArrayType<string[]>, string>>();
        checkTrue<AreEqual<ArrayType<(number | string)[]>, (number | string)>>();
        checkTrue<AreEqual<ArrayType<(1 | 2)[]>, (1 | 2)>>();
        checkTrue<AreEqual<ArrayType<{ num: 5 }[]>, { num: 5 }>>();
        checkTrue<AreEqual<ArrayType<undefined[]>, undefined>>();
        checkTrue<AreEqual<ArrayType<never[]>, never>>();
    });

    test('Flatten', () => {
        checkTrue<AreEqual<Flatten<number[][]>, number[]>>();
        checkTrue<AreEqual<Flatten<string[][]>, string[]>>();
        checkTrue<AreEqual<Flatten<(number | string)[][]>, (number | string)[]>>();
        checkTrue<AreEqual<Flatten<undefined[][]>, undefined[]>>();
        checkTrue<AreEqual<Flatten<null[][]>, null[]>>();
        checkTrue<AreEqual<Flatten<never[][]>, never[]>>();
        checkTrue<AreEqual<Flatten<any[][]>, any[]>>();
        
        checkTrue<AreEqual<Flatten<number[][][]>, number[][]>>();
        checkTrue<AreEqual<Flatten<number[][][][]>, number[][][]>>();
        
        checkTrue<AreEqual<Flatten<[number[], string[]]>, [number, string]>>();
        checkTrue<AreEqual<Flatten<[number[][], string[][]]>, [number[], string[]]>>();
        checkTrue<AreEqual<Flatten<[number[], string[][]]>, [number, string[]]>>();
    });

    test('DeepReadonly type', () => {
        type ReadOnlyObject = DeepReadonly<{ a: number, b: { c: string; }; }>;
        const obj: ReadOnlyObject = { a: 1, b: { c: "string" } };
        // no counter example as modifying would be a compile error
    });

    test('DeepMutable type', () => {
        type MutableObject = DeepMutable<{ readonly a: number, readonly b: { readonly c: string; }; }>;
        const obj: MutableObject = { a: 1, b: { c: "string" } };
        obj.a = 2; // this should pass
        obj.b.c = "another string"; // this should pass
    });

    test('SplitString type', () => {
        checkTrue<AreEqual<
            SplitString<"A,B,C", ",">, 
            ["A", "B", "C"]
        >>();
    });

    test('Single type', () => {
        type SingleNumber = Single<number>;
        const val: SingleNumber = [1];
        // @ts-expect-error
        const notVal: SingleNumber = [1, 2];
    });

    test('Pair type', () => {
        type NumberStringPair = Pair<number, string>;
        const pair: NumberStringPair = [1, "one"];
        // @ts-expect-error
        const notPair: NumberStringPair = [1, "one", true];
    });

    test('Triple type', () => {
        type NumberStringBooleanTriple = Triple<number, string, boolean>;
        const triple: NumberStringBooleanTriple = [1, "one", true];
        // @ts-expect-error
        const notTriple: NumberStringBooleanTriple = [1, "one", true, 4];
    });

    test('TupleOf type', () => {
        type Zero = TupleOf<number, 0>;
        type One = TupleOf<number, 1>;
        type Two = TupleOf<number, 2>;
        type Three = TupleOf<number, 3>;

        const zero: Zero = [];
        // @ts-expect-error
        const notZero: Zero = [1];
        
        const one: One = [1];
        // @ts-expect-error
        const notOne: One = [1, 2];

        const two: Two = [1, 2];
        // @ts-expect-error
        const notTwo: Two = [1, 2, 3];
        
        const three: Three = [1, 2, 3];
        // @ts-expect-error
        const notThree: Tree = [1, 2, 3, 4];
    });

    test('Dictionary type', () => {
        type NumberDictionary = Dictionary<string, number>;
        const dic: NumberDictionary = { one: 1 };

        // @ts-expect-error
        const notDic: NumberDictionary = { one: "one" };
    });

    test('StringDictionary type', () => {
        const dic: StringDictionary<number> = { one: 1 };

        // @ts-expect-error
        const notDic: StringDictionary<number> = { one: "one" };
    });

    test('NumberDictionary type', () => {
        const dic: NumberDictionary<string> = { 1: "one" };

        // @ts-expect-error
        const notDic: NumberDictionary<string> = { 1: 1 };
    });

    test('Constructor type', () => {
        class Foo { }
        type FooConstructor = Constructor<Foo>;
        const foo: FooConstructor = Foo;
    });
    
    test('ExactConstructor type', () => {
        class Foo { constructor(a: number, b: string) {} }
        type FooConstructor = ExactConstructor<typeof Foo>;
        let foo: FooConstructor = Foo;
        
        class Foo2 { constructor(a: string) {} }
        // @ts-expect-error
        foo = Foo2;
        
        class Foo3 { constructor(a: number) {} }
        foo = Foo3;
    });

    test('Comparator type', () => {
        type NumberComparator = Comparator<number>;
        const compare: NumberComparator = (a, b) => a - b;
    });

    test('IsTruthy type', () => {
        checkFalse<IsTruthy<false>>();
        checkFalse<IsTruthy<0>>();
        checkFalse<IsTruthy<''>>();
        checkFalse<IsTruthy<[]>>();
        checkFalse<IsTruthy<{}>>();
        checkFalse<IsTruthy<void>>();
        checkFalse<IsTruthy<never>>();
        
        checkTrue<IsTruthy<true>>();
        checkTrue<IsTruthy<1>>();
        checkTrue<IsTruthy<'2'>>();
        checkTrue<IsTruthy<[1]>>();
        checkTrue<IsTruthy<{ a: 5 }>>();
    });

    test('IsString type', () => {
        checkTrue<IsString<"hello">>();
        checkFalse<IsString<42>>();
        checkFalse<IsString<void>>();
        checkFalse<IsString<true>>();
        // let tFail: T = false; // This should fail
    });

    test('IsNumber type', () => {
        checkTrue<IsNumber<42>>();
        checkFalse<IsNumber<false>>();
        checkFalse<IsNumber<'42'>>();
        // let tFail: T = false; // This should fail
    });

    test('IsBoolean type', () => {
        checkTrue<IsBoolean<false>>();
        checkTrue<IsBoolean<true>>();
        checkTrue<IsBoolean<boolean>>();
        
        checkFalse<IsBoolean<5>>();
        checkFalse<IsBoolean<void>>();
        checkFalse<IsBoolean<never>>();
        checkFalse<IsBoolean<{}>>();
    });

    test('IsNull type', () => {
        checkTrue<IsNull<null>>();
        checkFalse<IsNull<undefined>>();
        checkFalse<IsNull<void>>();
        checkFalse<IsNull<never>>();
        checkFalse<IsNull<1>>();
        checkFalse<IsNull<'1'>>();
    });
    
    test('IsArray type', () => {
        checkTrue<IsArray<[1, 2, 3]>>();
        checkTrue<IsArray<[]>>();
        checkFalse<IsArray<{}>>();
        checkFalse<IsArray<void>>();
    });

    test('IsObject type', () => {
        checkTrue<IsObject<{}>>();
        checkTrue<IsObject<{ a: true; }>>();
        checkFalse<IsObject<5>>();
        checkFalse<IsObject<null>>();
    });

    test('IsAny type', () => {
        checkTrue<IsAny<any>>();
        checkFalse<IsAny<boolean>>();
        checkFalse<IsAny<number>>();
        checkFalse<IsAny<string>>();
        checkFalse<IsAny<object>>();
        checkFalse<IsAny<Array<any>>>();
        checkFalse<IsAny<void>>();
        checkFalse<IsAny<never>>();
    });

    test('AreEqual type', () => {
        // true
        {
            checkTrue<AreEqual<any, any>>();
            checkTrue<AreEqual<unknown, unknown>>();
            checkTrue<AreEqual<never, never>>();
            checkTrue<AreEqual<number, number>>();
            checkTrue<AreEqual<boolean, boolean>>();
            checkTrue<AreEqual<string, string>>();
            checkTrue<AreEqual<symbol, symbol>>();
            checkTrue<AreEqual<Symbol, Symbol>>();
            checkTrue<AreEqual<Function, Function>>();
            checkTrue<AreEqual<undefined, undefined>>();
            checkTrue<AreEqual<null, null>>();
            checkTrue<AreEqual<0, 0>>();
            checkTrue<AreEqual<1, 1>>();
            checkTrue<AreEqual<false, false>>();
            checkTrue<AreEqual<true, true>>();
            checkTrue<AreEqual<'', ''>>();
            checkTrue<AreEqual<[], []>>();
            checkTrue<AreEqual<[1], [1]>>();
            checkTrue<AreEqual<[1, 2], [1, 2]>>();
            checkTrue<AreEqual<{}, {}>>();
            checkTrue<AreEqual<object, object>>();
            checkTrue<AreEqual<{ a: boolean }, { a: boolean }>>();
            checkTrue<AreEqual<{ a: { b: string } }, { a: { b: string } }>>();

            checkTrue<AreEqual<() => void, () => void>>();
            checkTrue<AreEqual<() => any, () => any>>();
            checkTrue<AreEqual<(<T>() => T), <T>() => T>>();
            checkTrue<AreEqual<(<T>() => T), <U>() => U>>();
        }

        // false
        {
            checkFalse<AreEqual<"a", "b">>();
            checkFalse<AreEqual<"a", undefined>>();
            checkFalse<AreEqual<"a", { a: 'hello world'; }>>();

            checkFalse<AreEqual<any, never>>();
            checkFalse<AreEqual<any, unknown>>();
            checkFalse<AreEqual<any, 1>>();
            checkFalse<AreEqual<any, false>>();
            checkFalse<AreEqual<unknown, never>>();
            
            checkFalse<AreEqual<{ a: boolean }, { b: boolean }>>();
            checkFalse<AreEqual<{ a: boolean }, { a?: boolean }>>();
            checkFalse<AreEqual<{ a: boolean }, { a: boolean, b?: boolean }>>();
            checkFalse<AreEqual<string, number>>();
            checkFalse<AreEqual<1, 2>>();
            checkFalse<AreEqual<1, 1 | 2>>();
            checkFalse<AreEqual<{ a: 1, b: 2 }, { a: 1 } & { b: 2 }>>();

            checkFalse<AreEqual<() => void, () => any>>();
            checkFalse<AreEqual<() => void, (param: boolean) => void>>();
            checkFalse<AreEqual<() => void, (param?: boolean) => void>>();
        }

        // weird
        {
            checkFalse<AreEqual<{ a: 1, b: 2 }, { a: 1 } & { b: 2 }>>();
            checkTrue<AreEqual<'a' | 'b', ('a' | 'b' & unknown)>>();
        }
    });

    test('ConcatArray type', () => {
        checkTrue<AreEqual<
            ConcatArray<[1, 2], [3, 4]>,
            [1, 2, 3, 4]
        >>();
    });

    test('NestedArray type', () => {
        type Numbers = NestedArray<number>;
        const nums: Numbers = [1, 2, [3, 4, [5, 6]]];
        
        // @ts-expect-error
        const notNums: Numbers = [1, 2, "3", [4, 5]];
    });

    test('NonEmptyArray type', () => {
        const test1: NonEmptyArray<number> = [1];                 // Should pass
        const test2: NonEmptyArray<string> = ['first', 'second']; // Should pass

        // @ts-expect-error
        const test3: NonEmptyArray<number> = [];
        // @ts-expect-error
        const test4: NonEmptyArray<string> = ['first', undefined];
        // @ts-expect-error
        const test5: NonEmptyArray<boolean> = [true, 'notABoolean'];
    });

    test('AtMostNArray type', () => {
        let arr: AtMostNArray<number, 5> = [];
        arr = [1];
        arr = [1, 1];
        arr = [1, 1, 3];
        arr = [1, 1, 3, 4];
        arr = [1, 1, 3, 4, 5];
        // @ts-expect-error
        arr = [1, 1, 3, 4, 5, 6];
    });
    
    test('AtLeastNArray type', () => {
        type AtLeast3 = AtLeastNArray<string, 3>;
        ['a', 'b', 'c', 'd'] satisfies AtLeast3;
        ['a', 'b', 'c'] satisfies AtLeast3;
        // @ts-expect-error
        ['a', 'b'] satisfies AtLeast3;

        type AtLeast1 = AtLeastNArray<string, 1>;
        ['a', 'b', 'c', 'd'] satisfies AtLeast1;
        ['a'] satisfies AtLeast1;
        // @ts-expect-error
        [] satisfies AtLeast1;

        type AtLeast0 = AtLeastNArray<string, 0>;
        ['a'] satisfies AtLeast0;
        [] satisfies AtLeast0;
    });

    test('Mutable type', () => {
        type MutableString = Mutable<Readonly<string[]>>;
        const mutable: MutableString = ["a", "b"];
        mutable[0] = 'c'; // this should pass
    });

    test('MapTypes type', () => {
        type NewObject = MapTypes<{ a: string, b: number, c: boolean; }, { from: string, to: number; }>;
        const obj: NewObject = { a: 1, b: 2, c: true };
        
        // @ts-expect-error
        const notObj: NewObject = { a: "1", b: 2, c: true };
    });

    test('Promisify type', () => {
        type Promisified = Promisify<{ a: () => number; }>;
        const promisified: Promisified = { a: () => Promise.resolve(1) };
        // no counter example as assigning another value would be a compile error
    });

    suite('ReplaceType utility type', () => {
        test('should replace ContextKeyExpr with boolean in a nested object', () => {
            interface ContextKeyExpr { num?: number; }
            interface Example {
                key1: string;
                key2: ContextKeyExpr;
                key3: {
                    nestedKey: ContextKeyExpr;
                    anotherKey: number;
                };
            }

            type ResolvedExample = ReplaceType<Example, ContextKeyExpr, boolean>;
            const valid: ResolvedExample = {
                key1: "test",
                key2: true,
                key3: {
                    nestedKey: false,
                    anotherKey: 123,
                },
            }; // Should pass

            const invalidKey2: ResolvedExample = {
                key1: "test",
                // @ts-expect-error: key2 must be a boolean
                key2: {},
                key3: {
                    nestedKey: false,
                    anotherKey: 123,
                },
            };
            
            const invalidNestedKey: ResolvedExample = {
                key1: "test",
                key2: true,
                key3: {
                    // @ts-expect-error: nestedKey must be a boolean
                    nestedKey: {},
                    anotherKey: 123,
                },
            };
        });

        test('should replace string with number in a nested object', () => {
            interface Example {
                key1: string;
                key2: {
                    nestedString: string;
                    otherValue: boolean;
                };
            }

            type ReplaceStringWithNumber = ReplaceType<Example, string, number>;

            const valid: ReplaceStringWithNumber = {
                key1: 123,
                key2: {
                    nestedString: 456,
                    otherValue: true,
                },
            }; // Should pass

            const invalidKey1: ReplaceStringWithNumber = {
                // @ts-expect-error: key1 must be a number
                key1: "invalid",
                key2: {
                    nestedString: 456,
                    otherValue: true,
                },
            };

            const invalidNestedString: ReplaceStringWithNumber = {
                key1: 123,
                key2: {
                    // @ts-expect-error: nestedString must be a number
                    nestedString: "invalid",
                    otherValue: true,
                },
            };
        });

        test('should replace multiple occurrences of ContextKeyExpr with boolean', () => {
            interface ContextKeyExpr { num?: number; }
            interface Example {
                key1: ContextKeyExpr;
                key2: ContextKeyExpr;
                key3: {
                    nestedKey: ContextKeyExpr;
                };
            }

            type ResolvedExample = ReplaceType<Example, ContextKeyExpr, boolean>;

            const valid: ResolvedExample = {
                key1: true,
                key2: false,
                key3: {
                    nestedKey: true,
                },
            }; // Should pass

            const invalidKey1: ResolvedExample = {
                // @ts-expect-error: key1 must be a boolean
                key1: {},
                key2: false,
                key3: {
                    nestedKey: true,
                },
            };

            const invalidKey2: ResolvedExample = {
                key1: true,
                // @ts-expect-error: key2 must be a boolean
                key2: {},
                key3: {
                    nestedKey: true,
                },
            };
        });

        test('should replace primitive type in an array', () => {
            type Example = string[];
            type ResolvedExample = ReplaceType<Example, string, number>;

            const valid: ResolvedExample = [1, 2, 3]; // Should pass

            // @ts-expect-error: array elements must be numbers
            const invalid: ResolvedExample = ["invalid"];
        });

        test('should handle deeply nested structures', () => {
            interface ContextKeyExpr { num?: number; }
            interface Example {
                key1: {
                    nestedKey: {
                        deepNestedKey: ContextKeyExpr;
                    };
                };
            }

            type ResolvedExample = ReplaceType<Example, ContextKeyExpr, boolean>;
            const valid: ResolvedExample = {
                key1: {
                    nestedKey: {
                        deepNestedKey: true,
                    },
                },
            }; // Should pass

            const invalidDeepNestedKey: ResolvedExample = {
                key1: {
                    nestedKey: {
                        // @ts-expect-error: deepNestedKey must be a boolean
                        deepNestedKey: {},
                    },
                },
            };
        });

        test('should preserve non-matching types and replace only the target type', () => {
            interface ContextKeyExpr { num?: number; }
            interface Example {
                key1: string;
                key2: ContextKeyExpr;
                key3: number;
            }

            type ResolvedExample = ReplaceType<Example, ContextKeyExpr, boolean>;
            const valid: ResolvedExample = {
                key1: "unchanged",
                key2: true,
                key3: 42,
            }; // Should pass

            const invalidKey2: ResolvedExample = {
                key1: "unchanged",
                // @ts-expect-error: key2 must be a boolean
                key2: {},
                key3: 42,
            };
        });
    });
});