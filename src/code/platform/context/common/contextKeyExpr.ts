import { Arrays } from "src/base/common/util/array";
import { isObject, isString } from "src/base/common/util/type";
import { IReadonlyContext } from "src/code/platform/context/common/context";

/**
 * A context key expression (ContextKeyExpr) is a series of logical expression
 * that can either be evaluated TRUE or FALSE depends on the given context by 
 * calling {@link IContextKeyExpr.evaluate}.
 * 
 * All the expressions (except False, True, And, Or) requires a `key` input as
 * the key of the context during the evaluation.
 * 
 * When there is an action requires a pre-condition on the current context, this 
 * is where the context key expression comes into place.
 * 
 * @note To create a context key expression, the only valid way is by using the
 * methods from namespace {@link CreateContextKeyExpr}.
 * @note The context key expression is also easy for human reading since every 
 * expression is serializable and deserializable.
 */
export type ContextKeyExpr = (
    ContextKeyFalseExpr |
    ContextKeyTrueExpr |
    ContextKeyHasExpr |
    ContextKeyNotExpr |
    ContextKeyEqualsExpr |
    ContextKeyNotEqualsExpr |
    ContextKeyAndExpr |
    ContextKeyOrExpr |
    ContextKeyInExpr |
    ContextKeyRegexExpr |
    ContextKeyGreaterExpr |
    ContextKeyGreaterEqualsExpr |
    ContextKeySmallerExpr |
    ContextKeySmallerEqualsExpr
);

/**
 * The interface for every {@link ContextKeyExpr}.
 */
export interface IContextKeyExpr {
    
    /**
     * The type of the expression.
     */
    readonly type: ContextKeyExprType;

    /**
     * @description If the expression evaluates (matches) the given context as 
     * true or false.
     * @param context The given context.
     */
    evaluate(context: IReadonlyContext): boolean;

    /**
     * @description Compares if two expressions are the same.
     * @param other The other expression.
     */
    equal(other: ContextKeyExpr): boolean;

    /**
     * @description Serializes the expressions into string.
     */
    serialize(): string;
}

export const enum ContextKeyExprType {
    False,
	True,
	Has,
	Not,
	Equals,
	NotEquals,
	And,
	Or,
	In,
    Regex,
	Greater,
	GreaterEquals,
	Smaller,
	SmallerEquals,
}

/**
 * A namespace that collects all the context key exprresion cosntruction method.
 * You cannot create the expression by your own.
 */
export namespace CreateContextKeyExpr {

    export function False(): ContextKeyExpr {
        return ContextKeyFalseExpr.Instance;
    }

    export function True(): ContextKeyExpr {
        return ContextKeyTrueExpr.Instance;
    }

    export function Has(key: string): ContextKeyExpr {
        return ContextKeyHasExpr.create(key);
    }

    export function Not(key: string): ContextKeyExpr {
        return ContextKeyNotExpr.create(key);
    }

    export function Equals(key: string, value: any): ContextKeyExpr {
        return ContextKeyEqualsExpr.create(key, value);
    }

    export function NotEquals(key: string, value: any): ContextKeyExpr {
        return ContextKeyNotEqualsExpr.create(key, value);
    }

    export function And(...expressions: ContextKeyExpr[]): ContextKeyExpr {
        return ContextKeyAndExpr.create(expressions);
    }

    export function Regex(key: string, regexp: RegExp): ContextKeyExpr {
        return ContextKeyRegexExpr.create(key, regexp);
    }

    export function Or(...expressions: ContextKeyExpr[]): ContextKeyExpr {
        return ContextKeyOrExpr.create(expressions);
    }

    export function In(key: string, valueKey: string): ContextKeyExpr {
        return ContextKeyInExpr.create(key, valueKey);
    }

    export function Greater(key: string, value: string | number): ContextKeyExpr {
        return ContextKeyGreaterExpr.create(key, value);
    }

    export function GreaterEquals(key: string, value: string | number): ContextKeyExpr {
        return ContextKeyGreaterEqualsExpr.create(key, value);
    }

    export function Smaller(key: string, value: string | number): ContextKeyExpr {
        return ContextKeySmallerExpr.create(key, value);
    }

    export function SmallerEquals(key: string, value: string | number): ContextKeyExpr {
        return ContextKeySmallerEqualsExpr.create(key, value);
    }
}

abstract class ContextKeyExprBase<TType extends ContextKeyExprType> implements IContextKeyExpr {

    public readonly type: TType;

    constructor(type: TType) {
        this.type = type;
    }

    public abstract evaluate(context: IReadonlyContext): boolean;
    public abstract equal(other: ContextKeyExpr): boolean;
    public abstract serialize(): string;

    /**
     * @internal
     * @description Compares the order of two expressions. Useful when sorting.
     * @param other The other expression.
     * @returns A negative number if the current expression comes first. A
     *          positive number if the other expression comes first. Zero if two
     *          are identical.
     */
    public abstract compare(other: ContextKeyExpr): number;
}

function __compare1(key1: string, key2: string): number {
    if (key1 < key2) {
		return -1;
	}
	if (key1 > key2) {
		return 1;
	}
	return 0;
}

function __compare2(key1: string, value1: any, key2: string, value2: any): number {
	if (key1 < key2) {
		return -1;
	}
	if (key1 > key2) {
		return 1;
	}
	if (value1 < value2) {
		return -1;
	}
	if (value1 > value2) {
		return 1;
	}
	return 0;
}

function __compare3(expr1: readonly ContextKeyExpr[], expr2: readonly ContextKeyExpr[]): number {
    if (expr1.length < expr2.length) {
        return -1;
    }
    if (expr1.length > expr2.length) {
        return 1;
    }
    for (let i = 0; i < expr1.length; i++) {
        const expr = expr1[i]!;
        const otherExpr = expr2[i]!;
        const r = expr.compare(otherExpr);
        if (r !== 0) {
            return r;
        }
    }
    return 0;
}

/**
 * An expression that always evaluates as false.
 */
class ContextKeyFalseExpr extends ContextKeyExprBase<ContextKeyExprType.False> {

    public static readonly Instance = new ContextKeyFalseExpr();
    
    private constructor() {
        super(ContextKeyExprType.False);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return false;
    }

    public equal(other: ContextKeyExpr): boolean {
        return this.type === other.type;
    }
    
    public serialize(): string {
        return 'false';
    }

    public compare(other: ContextKeyExpr): number {
        return this.type - other.type;
    }
}

/**
 * An expression that always evaluates as true.
 */
class ContextKeyTrueExpr extends ContextKeyExprBase<ContextKeyExprType.True> {

    public static readonly Instance = new ContextKeyTrueExpr();
    
    private constructor() {
        super(ContextKeyExprType.True);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return true;
    }

    public equal(other: ContextKeyExpr): boolean {
        return this.type === other.type;
    }
    
    public serialize(): string {
        return 'true';
    }

    public compare(other: ContextKeyExpr): number {
        return this.type - other.type;
    }
}

/**
 * An expression that only evaluates as true when the given context defines the
 * `key`.
 */
class ContextKeyHasExpr extends ContextKeyExprBase<ContextKeyExprType.Has> {

    public static create(key: string): ContextKeyExpr {
        return new ContextKeyHasExpr(key);
    }

    private constructor(public readonly key: string) {
        super(ContextKeyExprType.Has);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return !!context.getValue(this.key);
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key);
    }
    
    public serialize(): string {
        return this.key;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
        return __compare1(this.key, other.key);
    }
}

/**
 * An expression that only evaluates as true when the given context does not
 * define, OR the context value of the `key` is null or undefined.
 */
class ContextKeyNotExpr extends ContextKeyExprBase<ContextKeyExprType.Not> {

    public static create(key: string): ContextKeyExpr {
        return new ContextKeyNotExpr(key);
    }

    private constructor(public readonly key: string) {
        super(ContextKeyExprType.Not);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return !context.getValue(this.key);
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key);
    }
    
    public serialize(): string {
        return `!${this.key}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare1(this.key, other.key);
    }
}

/**
 * An expression that only evaluates as true when the context value equals to 
 * the desired value.
 */
class ContextKeyEqualsExpr extends ContextKeyExprBase<ContextKeyExprType.Equals> {

    public static create(key: string, value: any): ContextKeyExpr {
        return new ContextKeyEqualsExpr(key, value);
    }

    private constructor(private readonly key: string, private readonly value: any) {
        super(ContextKeyExprType.Equals);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return context.getValue(this.key) === this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} == ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

/**
 * An expression that only evaluates as true when the context value not equals 
 * to the desired value.
 */
class ContextKeyNotEqualsExpr extends ContextKeyExprBase<ContextKeyExprType.NotEquals> {

    public static create(key: string, value: any): ContextKeyExpr {
        return new ContextKeyNotEqualsExpr(key, value);
    }

    private constructor(private readonly key: string, private readonly value: any) {
        super(ContextKeyExprType.NotEquals);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return context.getValue(this.key) !== this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} != ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

/**
 * An expression that only evaluates as true when all the given expressions are
 * evaluated to true.
 */
class ContextKeyAndExpr extends ContextKeyExprBase<ContextKeyExprType.And> {

    public static create(expressions: ContextKeyExpr[]): ContextKeyExpr {
        
        // normalization
        const valid: ContextKeyExpr[] = [];

        for (const expr of expressions) {

            if (expr.type === ContextKeyExprType.True) {
                continue;
            }
            if (expr.type === ContextKeyExprType.False) {
                return ContextKeyFalseExpr.Instance;
            }
            if (expr.type === ContextKeyExprType.And) {
                valid.push(...expr.expressions);
                continue;
            }

            valid.push(expr);
        }
        
        if (valid.length === 0) {
            return ContextKeyTrueExpr.Instance;
        }
        
        /**
         * This does not necessarily remove duplicates one since the expressions
         * are not sorted.
         */
		for (let i = 1; i < valid.length; i++) {
			if (valid[i - 1]!.equal(valid[i]!)) {
				valid.splice(i, 1);
				i--;
			}
		}

        if (valid.length === 1) {
            return valid[0]!;
        }

        return new ContextKeyAndExpr(valid);
    }

    private constructor(private readonly expressions: ContextKeyExpr[]) {
        super(ContextKeyExprType.And);
    }

    public evaluate(context: IReadonlyContext): boolean {
        for (const expr of this.expressions) {
            if (!expr.evaluate(context)) {
                return false;
            }
        }
        return true;
    }

    public equal(other: ContextKeyExpr): boolean {
        if (other.type === this.type) {
            if (this.expressions.length !== other.expressions.length) {
                return false;
            }

            for (let i = 0; i < this.expressions.length; i++) {
                if (!this.expressions[i]!.equal(other.expressions[i]!)) {
                    return false;
                }
            }
            
            return true;
        }
        return false;
    }
    
    public serialize(): string {
        return this.expressions.map(e => e.serialize()).join(' && ');
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare3(this.expressions, other.expressions);
    }
}

/**
 * An expression that only evaluates as true when any of the given expressions 
 * are evaluated to true.
 */
class ContextKeyOrExpr extends ContextKeyExprBase<ContextKeyExprType.Or> {

    public static create(expressions: ContextKeyExpr[]): ContextKeyExpr {
        
        // normalization
        const valid: ContextKeyExpr[] = [];
        
        for (const expr of expressions) {

            if (expr.type === ContextKeyExprType.False) {
                continue;
            }

            if (expr.type === ContextKeyExprType.True) {
                return ContextKeyTrueExpr.Instance;
            }

            if (expr.type === ContextKeyExprType.Or) {
                valid.push(...expr.expressions);
                continue;
            }

            valid.push(expr);
        }

        if (valid.length === 0) {
            return ContextKeyTrueExpr.Instance;
        }
        
        /**
         * This does not necessarily remove duplicates one since the expressions
         * are not sorted.
         */
		for (let i = 1; i < valid.length; i++) {
			if (valid[i - 1]!.equal(valid[i]!)) {
				valid.splice(i, 1);
				i--;
			}
		}

        if (valid.length === 1) {
            return valid[0]!;
        }
        
        return new ContextKeyOrExpr(valid);
    }

    private constructor(private readonly expressions: ContextKeyExpr[]) {
        super(ContextKeyExprType.Or);
    }

    public evaluate(context: IReadonlyContext): boolean {
        for (const expr of this.expressions) {
            if (expr.evaluate(context)) {
                return true;
            }
        }
        return false;
    }

    public equal(other: ContextKeyExpr): boolean {
        if (other.type === this.type) {
            if (this.expressions.length !== other.expressions.length) {
                return false;
            }

            for (let i = 0; i < this.expressions.length; i++) {
                if (!this.expressions[i]!.equal(other.expressions[i]!)) {
                    return false;
                }
            }
            
            return true;
        }
        return false;
    }
    
    public serialize(): string {
        return this.expressions.map(e => e.serialize()).join(' || ');
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare3(this.expressions, other.expressions);
    }
}

/**
 * An expression that only evaluates as true when the `key` is defined in the 
 * context value of the `valueKey`.
 */
class ContextKeyInExpr extends ContextKeyExprBase<ContextKeyExprType.In> {

    public static create(key: string, valueKey: string): ContextKeyExpr {
        return new ContextKeyInExpr(key, valueKey);
    }

    private constructor(private readonly key: string, private readonly valueKey: string) {
        super(ContextKeyExprType.In);
    }

    public evaluate(context: IReadonlyContext): boolean {
        const value = context.getValue(this.valueKey);

        if (Array.isArray(value)) {
            return value.indexOf(this.key) >= 0;
        }

        if (isObject(value) || isString(value)) {
            value.hasOwnProperty(this.key);
        }
        
        return false;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.valueKey === other.valueKey);
    }
    
    public serialize(): string {
        return `${this.key} in '${this.valueKey}'`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.valueKey, other.key, other.valueKey);
    }
}

/**
 * An expression that only evaluates as true when the context value matches the
 * regular expression `regexp`.
 */
class ContextKeyRegexExpr extends ContextKeyExprBase<ContextKeyExprType.Regex> {

    public static create(key: string, regexp: RegExp): ContextKeyExpr {
        return new ContextKeyRegexExpr(key, regexp);
    }

    private constructor(private readonly key: string, private readonly regexp: RegExp) {
        super(ContextKeyExprType.Regex);
    }

    public evaluate(context: IReadonlyContext): boolean {
        const value = context.getValue<any>(this.key);
        return value && this.regexp.test(value);
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.regexp.source === other.regexp.source);
    }
    
    public serialize(): string {
        const value = `/${this.regexp.source}/${this.regexp.ignoreCase ? 'i' : ''}`;
		return `${this.key} =~ ${value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		if (this.key < other.key) {
			return -1;
		}
		if (this.key > other.key) {
			return 1;
		}
		const thisSource = this.regexp.source;
		const otherSource = other.regexp.source;
		if (thisSource < otherSource) {
			return -1;
		}
		if (thisSource > otherSource) {
			return 1;
		}
		return 0;
    }
}

function __tryConvertToFloat(value: any, callback: (value: number) => ContextKeyExpr): ContextKeyExpr {
    if (isString(value)) {
        value = parseFloat(value);
    } else {
        return ContextKeyFalseExpr.Instance;
    }

    if (isNaN(value)) {
        return ContextKeyFalseExpr.Instance;
    }

    return callback(value);
}

/**
 * An expression that only evaluates as true when the desired value is greater
 * than the context value.
 */
class ContextKeyGreaterExpr extends ContextKeyExprBase<ContextKeyExprType.Greater> {

    public static create(key: string, value: number | string): ContextKeyExpr {
        return __tryConvertToFloat(value, val => new ContextKeyGreaterExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number) {
        super(ContextKeyExprType.Greater);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) > this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} > ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

/**
 * An expression that only evaluates as true when the desired value is greater
 * or equal to the context value.
 */
class ContextKeyGreaterEqualsExpr extends ContextKeyExprBase<ContextKeyExprType.GreaterEquals> {

    public static create(key: string, value: string | number): ContextKeyExpr {
        return __tryConvertToFloat(value, val => new ContextKeyGreaterEqualsExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number) {
        super(ContextKeyExprType.GreaterEquals);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) >= this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} >= ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

/**
 * An expression that only evaluates as true when the desired value is smaller
 * than the context value.
 */
class ContextKeySmallerExpr extends ContextKeyExprBase<ContextKeyExprType.Smaller> {

    public static create(key: string, value: string | number): ContextKeyExpr {
        return __tryConvertToFloat(value, val => new ContextKeySmallerExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number) {
        super(ContextKeyExprType.Smaller);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) < this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} < ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

/**
 * An expression that only evaluates as true when the desired value is smaller
 * or equal to the context value.
 */
class ContextKeySmallerEqualsExpr extends ContextKeyExprBase<ContextKeyExprType.SmallerEquals> {

    public static create(key: string, value: string | number): ContextKeyExpr {
        return __tryConvertToFloat(value, val => new ContextKeySmallerEqualsExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number) {
        super(ContextKeyExprType.SmallerEquals);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) <= this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public serialize(): string {
        return `${this.key} <= ${this.value}`;
    }

    public compare(other: ContextKeyExpr): number {
        if (other.type !== this.type) {
			return this.type - other.type;
		}
		return __compare2(this.key, this.value, other.key, other.value);
    }
}

export namespace ContextKeyDeserializer {
    export function deserialize(serialized: string): ContextKeyExpr | undefined {
        if (!serialized) {
            return undefined;
        }
        return deserializeOR(serialized);
    }

    function deserializeOR(serialized: string): ContextKeyExpr | undefined {
        const expressions = serialized.split('||');
        return ContextKeyOrExpr.create(Arrays.coalesce(expressions.map(expr => deserializeAND(expr))));
    }

    function deserializeAND(serialized: string): ContextKeyExpr | undefined {
        const expressions = serialized.split('&&');
        return ContextKeyAndExpr.create(Arrays.coalesce(expressions.map(expr => __deserialize(expr))));
    }
    
    function __deserialize(serialized: string): ContextKeyExpr | undefined {
        serialized = serialized.trim();

        if (serialized.indexOf('!=') >= 0) {
			const pieces = serialized.split('!=');
			return ContextKeyNotEqualsExpr.create(pieces[0]!.trim(), __deserializeValue(pieces[1]!));
		}

		if (serialized.indexOf('==') >= 0) {
			const pieces = serialized.split('==');
			return ContextKeyEqualsExpr.create(pieces[0]!.trim(), __deserializeValue(pieces[1]!));
		}

		if (serialized.indexOf('=~') >= 0) {
			const pieces = serialized.split('=~');
			return ContextKeyRegexExpr.create(pieces[0]!.trim(), __deserializeRegexValue(pieces[1]!));
		}

		if (serialized.indexOf(' in ') >= 0) {
			const pieces = serialized.split(' in ');
			return ContextKeyInExpr.create(pieces[0]!.trim(), pieces[1]!.trim());
		}

		if (/^[^<=>]+>=[^<=>]+$/.test(serialized)) {
			const pieces = serialized.split('>=');
			return ContextKeyGreaterEqualsExpr.create(pieces[0]!.trim(), pieces[1]!.trim());
		}

		if (/^[^<=>]+>[^<=>]+$/.test(serialized)) {
			const pieces = serialized.split('>');
			return ContextKeyGreaterExpr.create(pieces[0]!.trim(), pieces[1]!.trim());
		}

		if (/^[^<=>]+<=[^<=>]+$/.test(serialized)) {
			const pieces = serialized.split('<=');
			return ContextKeySmallerEqualsExpr.create(pieces[0]!.trim(), pieces[1]!.trim());
		}

		if (/^[^<=>]+<[^<=>]+$/.test(serialized)) {
			const pieces = serialized.split('<');
			return ContextKeySmallerExpr.create(pieces[0]!.trim(), pieces[1]!.trim());
		}

		if (/^\!\s*/.test(serialized)) {
			return ContextKeyNotExpr.create(serialized.substr(1).trim());
		}

		return ContextKeyHasExpr.create(serialized);
    }

    function __deserializeValue(serialized: string): any {
        serialized = serialized.trim();

		if (serialized === 'true') {
			return true;
		}
        if (serialized === 'false') {
			return false;
		}

		const m = /^'([^']*)'$/.exec(serialized);
		if (m) {
			return m[1]!.trim();
		}

		return serialized;
    }

    function __deserializeRegexValue(serialized: string): RegExp {
        if (!serialized || serialized.trim().length === 0) {
            console.warn('missing regexp-value for =~-expression');
			return new RegExp('');
		}

		const start = serialized.indexOf('/');
		const end = serialized.lastIndexOf('/');
		if (start === end || start < 0) {
            console.warn(`bad regexp-value '${serialized}', missing /-enclosure`);
			return new RegExp('');
		}

		const value = serialized.slice(start + 1, end);
		const isCaseIgnore = (serialized[end + 1] === 'i') ? 'i' : '';
		try {
			return new RegExp(value, isCaseIgnore);
		} catch (e) {
            console.warn(`bad regexp-value '${serialized}', parse error: ${e}`);
			return new RegExp('');
		}
    }
}