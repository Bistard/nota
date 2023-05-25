import { Pair } from "src/base/common/util/type";

/**
 * {@link IJsonNodeSchema} is a type used to represent a schema of JSON data. It 
 * allows for describing the structure of JSON data in a type-safe way in 
 * TypeScript. Depending on the 'type' property, which can be 'string', 'number', 
 * 'boolean', 'null', 'array', or 'object'.
 * 
 * For example, when 'type' is 'number', it can have 'minimum' and 'maximum' 
 * properties.
 * 
 * When 'type' is 'string', it can have 'minLength', 'maxLength', and 'format' 
 * properties. 
 * 
 * Similarly for 'array' and 'object', there are properties to describe the 
 * items in the array and the properties of the object respectively.
 * 
 * When you plan to extend the {@link IJsonNodeSchema} to add additional 
 * requirements, remember to inherit the base class {@link JsonNodeSchemaValidator}.
 * 
 * ## The Schema Example
 * ```ts
 * let userSchema: IJSONSchema = {
 *   type: 'object',
 *   properties: {
 *       name: { type: 'string' },
 *       age: { type: 'integer', minimum: 0 },
 *       email: { type: 'string', format: 'email' },
 *       address: {
 *           type: 'object',
 *           properties: {
 *               street: { type: 'string' },
 *               city: { type: 'string' },
 *               country: { type: 'string' }
 *           },
 *           required: ['street', 'city', 'country']
 *       },
 *       hobbies: {
 *           type: 'array',
 *           items: { type: 'string' }
 *       }
 *   },
 *   required: ['name', 'age', 'email', 'address', 'hobbies']
 * };
 * ```
 * ## The valid JSON Data
 * ```ts
 * let userData = {
 *     "name": "John Doe",
 *     "age": 30,
 *     "email": "john@example.com",
 *     "address": {
 *         "street": "123 Main St",
 *         "city": "Springfield",
 *         "country": "USA"
 *     },
 *     "hobbies": ["Reading", "Traveling", "Swimming"]
 * }
 * ```
 * 
 * ## Customized Validator
 * ```ts
 * class UserSchemaValidator extends JsonNodeSchemaValidator {
 *     public override validate(data: any): boolean {
 *         // ...
 *     }
 * }
 * 
 * const validator = new UserSchemaValidator(userSchema);
 * validator.validate(userData); // true
 * validator.validate({}); // false
 * ```
 */
export type IJsonNodeSchema = (
    IJsonNodeSchemaForNull |
    IJsonNodeSchemaForBoolean |
    IJsonNodeSchemaForNumber |
    IJsonNodeSchemaForString |
    IJsonNodeSchemaForArray |
    IJsonNodeSchemaForObject
);

type DataType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

interface IJsonNodeSchemaBase<TDataType extends DataType>  {
    
    /** The data type of the current schema node. */
    readonly type: TDataType;

    /** The identifier of the schema node. */
    readonly id?: string;

    /** The description of the schema node. */
    readonly description?: string;

    /** The default value of the current schema node. */
    readonly default?: any;

    /** If the schema is deprecated. */
    readonly deprecated?: boolean;
}

interface IJsonNodeSchemaForNull extends IJsonNodeSchemaBase<'null'> {}

interface IJsonNodeSchemaForBoolean extends IJsonNodeSchemaBase<'boolean'> {
    
    /** Default ones if the value is not provided. */
    readonly default?: boolean;
}

interface IJsonNodeSchemaForNumber extends IJsonNodeSchemaBase<'number'> {

    /** If only supports integer. */
    readonly integer?: boolean;

    /** Default ones if the value is not provided. */
    readonly default?: number;

    /** The minimum value requirement. */
    readonly minimum?: number;
    
    /** The maximum value requirement. */
    readonly maximum?: number;

    /** Provider a list of ranges to describe the valid number values. */
    readonly ranges?: Pair<number, number>[];
}

interface IJsonNodeSchemaForString extends IJsonNodeSchemaBase<'string'> {

    /** Default ones if the value is not provided. */
    readonly default?: string;

    /** The minimum length of the string. */
    readonly minLength?: number;

    /** The maximum length of the string. */
    readonly maxLength?: number;

    /** The predefined format of the string. Example: 'email', 'phone number', 'post adress' etc. */
    readonly format?: string;
}

interface IJsonNodeSchemaForArray extends IJsonNodeSchemaBase<'array'> {

    /** The items of the array. */
    readonly items?: IJsonNodeSchema | IJsonNodeSchema[];

    /** The minimum number of items required. */
    readonly minItems?: number;

    /** The maximum number of items required. */
	readonly maxItems?: number;

    /** If the items in the array should be unique. */
	readonly uniqueItems?: boolean;
}

interface IJsonNodeSchemaForObject extends IJsonNodeSchemaBase<'object'> {
    
    /** The properties of the schema node. */
    readonly properties?: Record<string, IJsonNodeSchema>;

    /** The minimum number of properties required. */
    readonly minProperties?: number;

    /** The maximum number of properties required. */
    readonly maxProperties?: number;

    /** The required properties. */
    readonly required?: string[];

    /** The optional properties. */
    readonly optionals?: string[];
}

export class JsonNodeSchemaValidator {

    private readonly _schema: IJsonNodeSchema;

    constructor(schema: IJsonNodeSchema) {
        this._schema = schema;
    }

    /**
     * @description Validates the provided data against the schema. Currently, 
     * it only checks if the schema is deprecated, in which case it returns 
     * `true`.
     * @param data The data to be validated.
     * @returns A boolean indicating whether the data Satisfies to the schema.
     */
    public validate(data: any): boolean {
        if (this._schema.deprecated) {
            return true;
        }
        return false;
    }
}