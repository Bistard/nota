import { isBoolean, isNonNullable, isNumber, isObject, isString } from "src/base/common/util/type";
import { IReadonlyContext } from "src/code/platform/context/common/context";

/**
 * A context key expression (ContextKeyExpr) is a series of logical expression
 * that can either be evaluated as TRUE or FALSE depends on the given 
 * {@link IContext} by calling {@link IContextKeyExpr['evaluate']}.
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
    ContextKeyEqualExpr |
    ContextKeyNotEqualExpr |
    ContextKeyAndExpr |
    ContextKeyOrExpr |
    ContextKeyInExpr |
    ContextKeyRegexExpr |
    ContextKeyGreaterExpr |
    ContextKeyGreaterEqualExpr |
    ContextKeySmallerExpr |
    ContextKeySmallerEqualExpr
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
     * @description Returns the negation of the current expression.
     */
    negate(): ContextKeyExpr;

    /**
     * @description Returns true if it is provable `this` implies `other`.
     * @param other The other expression.
     */
    imply(other: ContextKeyExpr): boolean;

    /**
     * @description Compares the order of two expressions. Useful when sorting.
     * @param other The other expression.
     * @returns A negative number if the current expression comes first. A
     *          positive number if the other expression comes first. Zero if two
     *          are identical.
     */
    compare(other: ContextKeyExpr): number;

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
	Equal,
	NotEqual,
	And,
	Or,
	In,
    Regex,
	Greater,
	GreaterEqual,
	Smaller,
	SmallerEqual,
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

    export function Equal(key: string, value: any): ContextKeyExpr {
        return ContextKeyEqualExpr.create(key, value);
    }

    export function NotEqual(key: string, value: any): ContextKeyExpr {
        return ContextKeyNotEqualExpr.create(key, value);
    }

    export function And(...expressions: ContextKeyExpr[]): ContextKeyExpr {
        return ContextKeyAndExpr.create(expressions);
    }

    export function Regex(key: string, regexp: RegExp): ContextKeyExpr {
        return ContextKeyRegexExpr.create(key, regexp);
    }

    export function Or(...expressions: ContextKeyExpr[]): ContextKeyExpr {
        return ContextKeyOrExpr.create(expressions, true);
    }

    export function In(key: string, valueKey: string): ContextKeyExpr {
        return ContextKeyInExpr.create(key, valueKey);
    }

    export function Greater(key: string, value: string | number): ContextKeyExpr {
        return ContextKeyGreaterExpr.create(key, value);
    }

    export function GreaterEqual(key: string, value: string | number): ContextKeyExpr {
        return ContextKeyGreaterEqualExpr.create(key, value);
    }

    export function Smaller(key: string, value: string | number): ContextKeyExpr {
        return ContextKeySmallerExpr.create(key, value);
    }

    export function SmallerEqual(key: string, value: string | number): ContextKeyExpr {
        return ContextKeySmallerEqualExpr.create(key, value);
    }
}

abstract class ContextKeyExprBase<TType extends ContextKeyExprType> implements IContextKeyExpr {

    public readonly type: TType;
    public negated: ContextKeyExpr | undefined;

    constructor(type: TType) {
        this.type = type;
        this.negated = undefined;
    }

    public abstract evaluate(context: IReadonlyContext): boolean;
    public abstract equal(other: ContextKeyExpr): boolean;
    public abstract negate(): ContextKeyExpr;
    public abstract serialize(): string;
    public abstract compare(other: ContextKeyExpr): number;

    public imply(other: ContextKeyExpr): boolean {
        if ((other.type === ContextKeyExprType.And) && 
                ((this.type !== ContextKeyExprType.Or) && 
                 (this.type !== ContextKeyExprType.And)
        )) {
            // covers the case: A imply A && B
            for (const qTerm of other.expressions) {
                if (this.equal(qTerm)) {
                    return true;
                }
            }
        }
    
        const notP = this.negate();
        const expr = __getTerminals(notP).concat(__getTerminals(other));
        expr.sort((a, b) => a.compare(b));
    
        for (let i = 0; i < expr.length; i++) {
            const a = expr[i]!;
            const notA = a.negate();
            for (let j = i + 1; j < expr.length; j++) {
                const b = expr[j]!;
                if (notA.equal(b)) {
                    return true;
                }
            }
        }
    
        return false;
    }
}

const constants = new Map<string, boolean>();
constants.set('false', false);
constants.set('true', true);

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

function __getTerminals(node: ContextKeyExpr): ContextKeyExpr[] {
	if (node.type === ContextKeyExprType.Or) {
		return node.expressions;
	}
	return [node];
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
    
    public negate(): ContextKeyExpr {
        return ContextKeyTrueExpr.Instance;
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
    
    public negate(): ContextKeyExpr {
        return ContextKeyFalseExpr.Instance;
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
        const value = constants.get(key);
        if (isNonNullable(value)) {
            return value ? ContextKeyTrueExpr.Instance : ContextKeyFalseExpr.Instance;
        }
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
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
            this.negated = ContextKeyNotExpr.create(this.key);
        }
        return this.negated;
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
        const value = constants.get(key);
        if (isNonNullable(value)) {
            return value ? ContextKeyFalseExpr.Instance : ContextKeyTrueExpr.Instance;
        }
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
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
            this.negated = ContextKeyHasExpr.create(this.key);
        }
        return this.negated;
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
class ContextKeyEqualExpr extends ContextKeyExprBase<ContextKeyExprType.Equal> {

    public static create(key: string, value: any): ContextKeyExpr {
        if (isBoolean(value)) {
			return value ? ContextKeyHasExpr.create(key) : ContextKeyNotExpr.create(key);
		}
		
        const constFound = constants.get(key);
		if (isBoolean(constFound)) {
			return (value === String(constFound) ? ContextKeyTrueExpr.Instance : ContextKeyFalseExpr.Instance);
		}

        return new ContextKeyEqualExpr(key, value);
    }

    private constructor(private readonly key: string, private readonly value: any) {
        super(ContextKeyExprType.Equal);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return context.getValue(this.key) === this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeyNotEqualExpr.create(this.key, this.value);
		}
		return this.negated;
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
class ContextKeyNotEqualExpr extends ContextKeyExprBase<ContextKeyExprType.NotEqual> {

    public static create(key: string, value: any): ContextKeyExpr {
        if (isBoolean(value)) {
			return value ? ContextKeyNotExpr.create(key) : ContextKeyHasExpr.create(key);
		}
		
        const constFound = constants.get(key);
		if (isBoolean(constFound)) {
			return (value === String(constFound) ? ContextKeyFalseExpr.Instance : ContextKeyTrueExpr.Instance);
		}

        return new ContextKeyNotEqualExpr(key, value);
    }

    private constructor(private readonly key: string, private readonly value: any) {
        super(ContextKeyExprType.NotEqual);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return context.getValue(this.key) !== this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeyEqualExpr.create(this.key, this.value);
		}
		return this.negated;
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
        
        // sort the expressions
        valid.sort((a, b) => a.compare(b));

        /**
         * This will properly remove all the duplicate terms since the 
         * expressions are already sorted properly.
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

        /**
         * We must distribute any OR expression because we don't support parens 
         * OR extensions will be at the end (due to sorting rules).
         */
		while (valid.length > 1) {
			const lastElement = valid[valid.length - 1]!;
			if (lastElement.type !== ContextKeyExprType.Or) {
				break;
			}
			// pop the last element
			valid.pop();

			// pop the second to last element
			const secondToLastElement = valid.pop()!;

			const isFinished = (valid.length === 0);

			// distribute `lastElement` over `secondToLastElement`
			const resultElement = ContextKeyOrExpr.create(
				lastElement.expressions.map(el => ContextKeyAndExpr.create([el, secondToLastElement])),
				isFinished
			);

			if (resultElement) {
				valid.push(resultElement);
				valid.sort((a, b) => a.compare(b));
			}
		}

        if (valid.length === 1) {
            return valid[0]!;
        }

        return new ContextKeyAndExpr(valid);
    }

    private constructor(public readonly expressions: ContextKeyExpr[]) {
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
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			const allNegated: ContextKeyExpr[] = [];
			for (const expr of this.expressions) {
				allNegated.push(expr.negate());
			}
			this.negated = ContextKeyOrExpr.create(allNegated, true);
		}
		return this.negated;
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

    public static create(expressions: ContextKeyExpr[], extraRedundantCheck: boolean): ContextKeyExpr {
        
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
            return ContextKeyFalseExpr.Instance;
        }
        
        // sort the expressions
        valid.sort((a, b) => a.compare(b));

        // remove duplicates expressions
		for (let i = 1; i < valid.length; i++) {
			if (valid[i - 1]!.equal(valid[i]!)) {
				valid.splice(i, 1);
				i--;
			}
		}

        for (let i = 0; i < valid.length; i++) {
            for (let j = i + 1; j < valid.length; j++) {
                if (valid[i]!.imply(valid[j]!)) {
                    valid.splice(j, 1);
                    j--;
                }
            }
        }

        if (valid.length === 1) {
            return valid[0]!;
        }

        return new ContextKeyOrExpr(valid);
    }

    private constructor(public readonly expressions: ContextKeyExpr[]) {
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
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			
            const allNegated: ContextKeyExpr[] = [];
			for (const expr of this.expressions) {
				allNegated.push(expr.negate());
			}

			/**
             * We don't support parens, so here we distribute the AND over the 
             * OR terminals. We always take the first 2 AND pairs and distribute 
             * them.
             */
			while (allNegated.length > 1) {
				const LEFT = allNegated.shift()!;
				const RIGHT = allNegated.shift()!;

				const all: ContextKeyExpr[] = [];
				for (const left of __getTerminals(LEFT)) {
					for (const right of __getTerminals(RIGHT)) {
						all.push(ContextKeyAndExpr.create([left, right]));
					}
				}

				const isFinished = (allNegated.length === 0);
				allNegated.unshift(ContextKeyOrExpr.create(all, isFinished));
			}

			this.negated = allNegated[0]!;
		}
		return this.negated;
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
 * An expression that only evaluates as true when the context value of `key` is 
 * defined in the context value of the `valueKey`.
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
        const desired = context.getValue(this.key);

        if (Array.isArray(value)) {
            return value.indexOf(desired) >= 0;
        }

        if (isObject(value) && isString(desired)) {
            return Object.prototype.hasOwnProperty.call(value, desired);
        }
        
        return false;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (this.type === other.type) && (this.key === other.key) && (this.valueKey === other.valueKey);
    }
    
    public negate(): ContextKeyExpr {
        // TODO
        throw new Error('Context key expression IN does not support negate.');
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
    
    public negate(): ContextKeyExpr {
        throw new Error('Context key expression REGEX does not support negate.');
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

function __toStringOrFloat(value: any, callback: (value: number | string) => ContextKeyExpr): ContextKeyExpr {
    const isStr = isString(value);
    const isNum = isNumber(value);

    if (!isStr && !isNum) {
        return ContextKeyFalseExpr.Instance;
    } 
    
    if (isStr) {
        const result = parseFloat(value);
        if (!isNaN(result)) {
            value = result;
        }
    }

    if (isNum && isNaN(value)) {
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
        return __toStringOrFloat(value, val => new ContextKeyGreaterExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number | string) {
        super(ContextKeyExprType.Greater);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) > this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeySmallerEqualExpr.create(this.key, this.value);
		}
		return this.negated;
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
class ContextKeyGreaterEqualExpr extends ContextKeyExprBase<ContextKeyExprType.GreaterEqual> {

    public static create(key: string, value: string | number): ContextKeyExpr {
        return __toStringOrFloat(value, val => new ContextKeyGreaterEqualExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number | string) {
        super(ContextKeyExprType.GreaterEqual);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) >= this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeySmallerExpr.create(this.key, this.value);
		}
		return this.negated;
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
        return __toStringOrFloat(value, val => new ContextKeySmallerExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number | string) {
        super(ContextKeyExprType.Smaller);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) < this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeyGreaterEqualExpr.create(this.key, this.value);
		}
		return this.negated;
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
class ContextKeySmallerEqualExpr extends ContextKeyExprBase<ContextKeyExprType.SmallerEqual> {

    public static create(key: string, value: string | number): ContextKeyExpr {
        return __toStringOrFloat(value, val => new ContextKeySmallerEqualExpr(key, val));
    }

    private constructor(private readonly key: string, private readonly value: number | string) {
        super(ContextKeyExprType.SmallerEqual);
    }

    public evaluate(context: IReadonlyContext): boolean {
        return (parseFloat(<any>context.getValue(this.key))) <= this.value;
    }

    public equal(other: ContextKeyExpr): boolean {
        return (other.type === this.type) && (this.key === other.key) && (this.value === other.value);
    }
    
    public negate(): ContextKeyExpr {
        if (!this.negated) {
			this.negated = ContextKeyGreaterExpr.create(this.key, this.value);
		}
		return this.negated;
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
    export function deserialize(serialized: string): ContextKeyExpr {
        return deserializeOR(serialized);
    }

    function deserializeOR(serialized: string): ContextKeyExpr {
        const expressions = serialized.split('||');
        return ContextKeyOrExpr.create(expressions.map(expr => deserializeAND(expr)), true);
    }

    function deserializeAND(serialized: string): ContextKeyExpr {
        const expressions = serialized.split('&&');
        return ContextKeyAndExpr.create(expressions.map(expr => __deserialize(expr)));
    }
    
    function __deserialize(serialized: string): ContextKeyExpr {
        serialized = serialized.trim();

        if (serialized.indexOf('!=') >= 0) {
			const [key, value] = serialized.split('!=');
			return ContextKeyNotEqualExpr.create(key!.trim(), __deserializeValue(value!));
		}

		if (serialized.indexOf('==') >= 0) {
			const [key, value] = serialized.split('==');
			return ContextKeyEqualExpr.create(key!.trim(), __deserializeValue(value!));
		}

		if (serialized.indexOf('=~') >= 0) {
			const [key, value] = serialized.split('=~');
			return ContextKeyRegexExpr.create(key!.trim(), __deserializeRegexValue(value!));
		}

		if (serialized.indexOf(' in ') >= 0) {
			const [key, value] = serialized.split(' in ');
			return ContextKeyInExpr.create(key!.trim(), value!.trim());
		}

		if (/^[^<=>]+>=[^<=>]+$/.test(serialized)) {
			const [key, value] = serialized.split('>=');
			return ContextKeyGreaterEqualExpr.create(key!.trim(), value!.trim());
		}

		if (/^[^<=>]+>[^<=>]+$/.test(serialized)) {
			const [key, value] = serialized.split('>');
			return ContextKeyGreaterExpr.create(key!.trim(), value!.trim());
		}

		if (/^[^<=>]+<=[^<=>]+$/.test(serialized)) {
			const [key, value] = serialized.split('<=');
			return ContextKeySmallerEqualExpr.create(key!.trim(), value!.trim());
		}

		if (/^[^<=>]+<[^<=>]+$/.test(serialized)) {
			const [key, value] = serialized.split('<');
			return ContextKeySmallerExpr.create(key!.trim(), value!.trim());
		}

		if (/^\!\s*/.test(serialized)) {
            return ContextKeyNotExpr.create(serialized.substring(1).trim());
		}

		return ContextKeyHasExpr.create(serialized);
    }

    function __deserializeValue(serialized: string): any {
        serialized = serialized.trim();

        const value = constants.get(serialized);
        if (isNonNullable(value)) {
            return value;
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